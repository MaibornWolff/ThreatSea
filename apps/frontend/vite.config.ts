import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";

export default defineConfig({
    base: "/",
    plugins: [react(), svgrPlugin()],
    cacheDir: ".vite",
    publicDir: "public",
    server: {
        open: true,
        port: 3000,
    },
    resolve: {
        tsconfigPaths: true,
    },
    build: {
        outDir: "build",
        sourcemap: false,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        // MUI Core (Material-UI components)
                        {
                            name: "mui",
                            test: /\/@mui\/material/,
                        },
                        // Excel/Office libraries
                        {
                            name: "excel-vendor",
                            test: /\/write-excel-file/,
                        },
                        // Canvas/Drawing libraries
                        {
                            name: "canvas-vendor",
                            test: /\/(?:react-)?konva/,
                        },
                        // React ecosystem
                        {
                            name: "react-vendor",
                            test: /\/react(?:-dom|-router)?/,
                        },
                    ],
                },
            },
        },
    },
    optimizeDeps: {
        force: true,
        // react-pdf is only imported from the report web worker. Pre-bundling keeps the worker fast.
        include: ["@react-pdf/renderer"],
    },
    worker: {
        format: "es",
    },
});
