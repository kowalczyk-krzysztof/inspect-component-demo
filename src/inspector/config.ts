import type { SourceLocation } from './types'

// Injected by each bundler's config (vite.config.ts `define`, webpack `DefinePlugin`) -
// the absolute path to the repo root on disk.
const PROJECT_ROOT: string = __PROJECT_ROOT__

export type EditorId = 'vscode' | 'cursor'

const toAbsolutePath = (source: SourceLocation): string => {
  // `source.fileName` is a repo-relative path like `/src/App.tsx`.
  return `${PROJECT_ROOT}${source.fileName}`.replace(/\/{2,}/g, '/')
}

export const getEditorUrl = (editor: EditorId, source: SourceLocation): string | null => {
  if (!PROJECT_ROOT) {
    return null
  }
  const absolutePath = toAbsolutePath(source)

  switch (editor) {
    case 'vscode':
      return `vscode://file${absolutePath}:${source.lineNumber}:${source.columnNumber}`
    case 'cursor':
      return `cursor://file${absolutePath}:${source.lineNumber}:${source.columnNumber}`
    default:
      return null
  }
}
