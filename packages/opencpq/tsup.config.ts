import { cpSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    external: ['react', 'react-dom'],
    onSuccess: async () => {
        cpSync('src/styles.css', 'dist/styles.css');
    }
});
