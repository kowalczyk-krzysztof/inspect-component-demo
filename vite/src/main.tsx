/**
 * Vite resolves <script src> in index.html relative to the served root, which can't escape
 * upward with "..". This tiny bootstrap lives inside the project so index.html can reference it,
 * and just re-runs the real (shared, bundler-agnostic) entry point.
 */
import '../../src/main.tsx'
