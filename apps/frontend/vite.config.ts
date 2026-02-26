import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";

export default defineConfig({
    base: "./",
    plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
    cacheDir: ".vite",
    publicDir: "public",
    server: {
        open: true,
        port: 3000,
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
                        // MUI Icons (separate chunk as it's large)
                        {
                            name: "mui-icons",
                            test: /\/@mui\/icons-material/,
                        },
                        // Excel/Office libraries
                        {
                            name: "excel-vendor",
                            test: /\/exceljs/,
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
    },
});
