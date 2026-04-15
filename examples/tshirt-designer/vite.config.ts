import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const libSrc = fileURLToPath(
    new URL("../../packages/opencpq/src/index.ts", import.meta.url)
);
const libStyles = fileURLToPath(
    new URL("../../packages/opencpq/src/styles.css", import.meta.url)
);

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@cbnsndwch/opencpq/styles.css": libStyles,
            "@cbnsndwch/opencpq": libSrc
        }
    }
});
