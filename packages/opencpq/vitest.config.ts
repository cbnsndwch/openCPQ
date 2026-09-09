import { defineConfig } from 'vitest/config';

// No @vitejs/plugin-react here: Vitest handles TSX transforms directly,
// which keeps the test config lean and avoids extra Vite plugin coupling.
export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.test.{ts,tsx}']
    }
});
