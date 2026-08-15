# demo-webpack

The webpack variant of the inspect-component demo. Runs the same shared app/inspector code as the
Vite project, from [../src](../src), using the same React version.

## Running

```sh
npm install    # from the repo root, installs both workspaces
npm run dev    # from this folder
```

Then open http://localhost:5273/

## webpack-specific notes

- `webpack.config.js` points `entry` directly at `../src/main.tsx` - webpack bundles files from
  anywhere on disk, so (unlike Vite) no local bootstrap file or `fs.allow`-style config is needed.
- Source is compiled with `ts-loader`. Its `configFile` option is set explicitly to this folder's
  `tsconfig.json`, because ts-loader otherwise searches upward from each source file and can pick
  up the wrong config; `noEmit` is overridden to `false`, since ts-loader needs real output (the
  tracked `tsconfig.json` has `noEmit: true` for editor type-checking).
- `jsx` is set to `react-jsxdev` in development and `react-jsx` in production. React 19's
  `jsxDEV` (from `react/jsx-dev-runtime`) only accepts 4 arguments and captures its own
  `new Error()` internally to build `fiber._debugStack` - so any transform that calls it in
  development mode works, without needing to compute `__source`/`__self` itself.
- `process.env.NODE_ENV` is replaced automatically based on webpack's `mode`, which is how React
  picks its development vs. production build and how the shared `main.tsx` decides whether to
  mount the inspector.
- `devtool` is `source-map`, so webpack emits a real, fetchable `main.[hash].js.map` alongside the
  bundle (unlike `eval`/`eval-source-map`, which only produce per-module inline maps). Because
  webpack concatenates every module into one file, a raw (unmapped) `Error().stack` position only
  points into that compiled bundle. `src/inspector/lib/source.ts` handles this the same way it
  handles Vite: it fetches the generated file, finds its trailing `//# sourceMappingURL=` comment
  (a relative/absolute `.map` URL here, vs. an inline base64 data URI for Vite), and uses
  `@jridgewell/trace-mapping`'s `originalPositionFor` to resolve the real file/line/column,
  skipping frames that map back into `node_modules` (React internals) until it finds the first
  application frame. `ts-loader`'s `compilerOptions.sourceMap` is explicitly forced to `true` so
  its emitted per-file maps have accurate original positions, since the tracked `tsconfig.json`
  doesn't set it (project references keep it off for editor type-checking).
