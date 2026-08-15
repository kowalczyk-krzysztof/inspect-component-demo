// Injected by each bundler's config (vite.config.ts `define`, webpack `DefinePlugin`).
declare const __PROJECT_ROOT__: string

// Both Vite and webpack replace `process.env.NODE_ENV` at build time by default.
declare const process: { env: { NODE_ENV?: string } }

declare module '*.css'
