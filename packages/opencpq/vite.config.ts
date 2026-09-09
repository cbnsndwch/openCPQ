import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    build: {
        emptyOutDir: true,
        lib: {
            entry: resolve(import.meta.dirname, 'src/index.ts'),
            fileName: 'index',
            formats: ['es']
        },
        minify: false,
        sourcemap: true,
        target: 'es2022',
        rollupOptions: {
            // Also externalize sub-path imports (react/jsx-runtime, react-dom/client);
            // otherwise the CJS jsx runtime is inlined and the ESM bundle can call require("react").
            external: [/^react(-dom)?(\/.*)?$/]
        }
    }
});
