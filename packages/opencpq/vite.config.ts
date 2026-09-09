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
            external: ['react', 'react-dom']
        }
    }
});
