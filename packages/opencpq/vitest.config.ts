import { defineConfig } from 'vitest/config';

// No @vitejs/plugin-react here: vitest's built-in esbuild transforms tsx
// fine for tests and avoids a peer-version clash with examples on vite 6.
export default defineConfig({
    esbuild: {
        jsx: 'automatic'
    },
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.test.{ts,tsx}']
    }
});
