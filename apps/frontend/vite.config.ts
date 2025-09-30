import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
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
        rollupOptions: {
            treeshake: true,
            output: {
                manualChunks: {
                    // MUI Core (Material-UI components)
                    mui: ["@mui/material"],
                    // MUI Icons (separate chunk as it's large)
                    "mui-icons": ["@mui/icons-material"],
                    // Excel/Office libraries
                    "excel-vendor": ["exceljs"],
                    // Canvas/Drawing libraries
                    "canvas-vendor": ["konva", "react-konva"],
                    // React ecosystem
                    "react-vendor": ["react", "react-dom", "react-router"],
                },
            },
        },
    },
    optimizeDeps: {
        force: true,
    },
});
