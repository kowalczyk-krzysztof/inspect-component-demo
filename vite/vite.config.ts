import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  plugins: [react()],
  define: {
    // Absolute path to the repo root, used by the inspector to build editor deep links.
    __PROJECT_ROOT__: JSON.stringify(repoRoot),
  },
  server: {
    // The shared ../src directory lives outside this project's root, so allow serving it.
    fs: { allow: [repoRoot] },
  },
})
