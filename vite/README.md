# demo-vite

The Vite variant of the inspect-component demo. Runs the shared app/inspector code in
[../src](../src).

## Running

```sh
npm install    # from the repo root, installs both workspaces
npm run dev    # from this folder
```

Then open the printed local URL (http://localhost:5173/ by default)

## Vite-specific notes

- `vite.config.ts` uses `@vitejs/plugin-react`, whose default JSX transform already emits calls to
  React's `jsxDEV` in development - no custom Babel config is needed for `fiber._debugStack` to be
  populated (see the root [README](../README.md) for why that matters on React 19).
- The shared source lives one level up in `../src`, outside this project's root. Vite normally
  refuses to serve files outside its root, so `vite.config.ts` adds `server.fs.allow` for the repo
  root, and computes `__PROJECT_ROOT__` (used by the inspector to build `vscode://`/`cursor://`
  links) from the config file's own location rather than `process.cwd()`.
- `index.html`'s `<script src="/src/main.tsx">` is resolved relative to *this* project's root, and
  can't use a `../` path to reach the shared code directly. `vite/src/main.tsx` is therefore a
  1-line bootstrap that just imports `../../src/main.tsx` (the real, shared entry point).
- Vite's dev transform injects Fast Refresh boilerplate into every module, so the line/column in a
  raw (unmapped) `Error().stack` drift further from the real source the more components a file
  has - there's no reliable 1:1 mapping to rely on. `src/inspector/lib/source.ts` always resolves
  through the file's own source map instead: it fetches the module (Vite inlines the map as a
  trailing base64 `//# sourceMappingURL=data:...` comment), decodes it, and uses
  `@jridgewell/trace-mapping`'s `originalPositionFor` to recover the real position - the same code
  path used for webpack's external `.map` files (see [../webpack/README.md](../webpack/README.md)).
