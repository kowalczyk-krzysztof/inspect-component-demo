import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping'
import type { FiberNode, SourceLocation } from '../types'

// Frames belonging to React/bundler internals rather than application code.
const IGNORED_FRAME_PATTERN = /node_modules|react-dom|react\/jsx-dev-runtime|react\/cjs|\/@react-refresh|webpack\/runtime|__webpack_require__/

/**
 * React 19 no longer attaches `_debugSource` to fibers. Instead each element carries a
 * `_debugStack` - an `Error` captured at the JSX call site - which is copied onto the fiber.
 * We parse its stack trace to recover the file/line/column where the component was rendered.
 *
 * The position in that stack is always a *generated* one: Vite's dev transform injects Fast
 * Refresh boilerplate (so line numbers drift further from the source as a file gains more
 * components), and webpack concatenates every module into one bundle. Both need the file's own
 * source map to recover the real original file/line/column - there's no reliable fast path.
 */
export const getDebugSource = async (fiber: FiberNode): Promise<SourceLocation | null> => {
  const stack = fiber._debugStack?.stack
  if (!stack) {
    return null
  }

  for (const line of stack.split('\n')) {
    const match = line.match(/(https?:\/\/[^\s)]+|\/[^\s)]+):(\d+):(\d+)/)
    if (!match) {
      continue
    }

    const [, rawFileName, lineText, columnText] = match

    // Skip frames that are conclusively React/bundler internals before doing any network work.
    if (IGNORED_FRAME_PATTERN.test(rawFileName)) {
      continue
    }

    const original = await resolveViaSourceMap(rawFileName, Number(lineText), Number(columnText))
    if (original) {
      if (IGNORED_FRAME_PATTERN.test(original.fileName)) {
        continue
      }
      return original
    }
  }

  return null
}

const extractSrcPath = (rawFileName: string): string | null => {
  const withoutQuery = rawFileName.split('?')[0]

  // The real repo-relative path is recoverable by slicing from the first `/src/` segment onward,
  // whatever prefix the bundler/dev-server put in front of it (`/@fs/<absolute path>`,
  // `webpack://<name>/./src/...`, an absolute filesystem path, etc.).
  const match = withoutQuery.match(/\/src\/.*$/)
  return match ? match[0] : null
}

const sourceMapCache = new Map<string, Promise<TraceMap | null>>()

/**
 * Fetches the generated file itself, finds its trailing `//# sourceMappingURL=` comment (an
 * inline base64 data URI for Vite's dev transform, or a relative/absolute URL to a real `.map`
 * file for webpack), and uses it to translate a generated position back to the original one.
 */
const resolveViaSourceMap = async (generatedUrl: string, generatedLine: number, generatedColumn: number): Promise<SourceLocation | null> => {
  const map = await loadSourceMap(generatedUrl)
  if (!map) {
    return null
  }

  const original = originalPositionFor(map, {
    line: generatedLine,
    // V8 stack trace columns are 1-based; source maps use 0-based columns.
    column: Math.max(0, generatedColumn - 1),
  })

  if (!original.source || original.line == null || original.column == null) {
    return null
  }

  // Vite's inline source maps list bare filenames (e.g. `App.tsx`) with no `sourceRoot`, so
  // resolve them against the generated file's own URL to recover the full path first.
  const resolvedSource = resolveUrl(original.source, generatedUrl)

  return {
    fileName: extractSrcPath(resolvedSource) ?? resolvedSource,
    lineNumber: original.line,
    columnNumber: original.column + 1,
  }
}

const resolveUrl = (source: string, base: string): string => {
  try {
    return new URL(source, base).toString()
  } catch {
    return source
  }
}

const loadSourceMap = (generatedUrl: string): Promise<TraceMap | null> => {
  let cached = sourceMapCache.get(generatedUrl)
  if (!cached) {
    cached = fetchSourceMap(generatedUrl)
    sourceMapCache.set(generatedUrl, cached)
  }
  return cached
}

const fetchSourceMap = async (generatedUrl: string): Promise<TraceMap | null> => {
  try {
    const response = await fetch(generatedUrl)
    if (!response.ok) {
      return null
    }

    const text = await response.text()
    const match = text.match(/\/\/[#@]\s*sourceMappingURL=(\S+)\s*$/)
    if (!match) {
      return null
    }

    const mapRef = match[1]
    if (mapRef.startsWith('data:')) {
      const base64Marker = 'base64,'
      const base64Index = mapRef.indexOf(base64Marker)
      if (base64Index === -1) {
        return null
      }
      return new TraceMap(JSON.parse(atob(mapRef.slice(base64Index + base64Marker.length))))
    }

    const mapResponse = await fetch(new URL(mapRef, generatedUrl))
    if (!mapResponse.ok) {
      return null
    }
    return new TraceMap(await mapResponse.json())
  } catch {
    return null
  }
}
