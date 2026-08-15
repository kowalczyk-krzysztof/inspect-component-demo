# inspect-component-demo

A developer tool for inspecting React components directly in the UI: hover the UI to highlight
the React component under the cursor, click it to open a flyout with its source location, owner
chain, and "open in editor" links.

The implementation is split into:

- [src/](src) - the shared, bundler-agnostic app and inspector implementation.
- [vite/](vite) - a Vite project that runs the shared code. See [vite/README.md](vite/README.md).
- [webpack/](webpack) - a webpack project that runs the same shared code. See
  [webpack/README.md](webpack/README.md).

Both projects are npm workspaces off the root `package.json`, so `npm install` at the repo root
installs everything (a single `react`/`react-dom` copy is shared by both).

## React 18 vs React 19: how component source info is found

The classic `_debugSource`/`_debugOwner` approach for this kind of tool targets **React 18**,
which no longer works unmodified on **React 19**. The two versions expose debug information on
the Fiber tree very differently:

### React 18

- Babel's JSX dev transform (`@babel/preset-react` with `development: true`) injects a `__source`
  prop (`{ fileName, lineNumber, columnNumber }`) and a `__self` prop onto every JSX element.
- React copies `__source` onto the corresponding Fiber node as **`fiber._debugSource`** - a plain
  object you can read directly.
- `fiber._debugOwner` points at the Fiber of the component that *rendered* this element, letting
  you walk up an owner chain.

```ts
// React 18
const { fileName, lineNumber, columnNumber } = fiber._debugSource
```

### React 19

- `_debugSource` and the `__source`/`__self` props were **removed**. Instead, `jsxDEV` captures a
  real `Error` at the JSX call site and attaches it to the element (and then the Fiber) as
  **`fiber._debugStack`**, alongside `fiber._debugTask` (an async owner task, Chrome-only).
- There's no more `{ fileName, lineNumber, columnNumber }` object - you have to parse
  `fiber._debugStack.stack` (a regular stack trace string) yourself, skipping frames that belong
  to React/bundler internals, to find the first application frame.
- That frame's position is a *generated* one, not necessarily the original source position - both
  Vite (Fast Refresh boilerplate shifts line numbers) and webpack (bundles every module into one
  file) require resolving it through the file's own source map to get the real file/line/column.
  See [vite/README.md](vite/README.md) and [webpack/README.md](webpack/README.md) for how each
  bundler's source maps are consumed at runtime.
- `fiber._debugOwner` is unchanged and still gives you the owner chain.
- React 19 also exposes a public dev-only helper, `React.captureOwnerStack()`, which formats the
  *current* owner stack - useful for error overlays, but not for inspecting an arbitrary
  already-rendered Fiber later, which is why this project parses `_debugStack` directly instead.

```ts
// React 19 - see src/inspector/lib/source.ts
const stack = fiber._debugStack.stack // an Error's .stack string
// Find the first non-internal frame, then resolve its generated position through the
// file's own source map to get the real file/line/column
```
