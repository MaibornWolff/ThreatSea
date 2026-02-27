import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import viteTsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [react(), viteTsconfigPaths({ projects: ["tsconfig.test.json"] })],
    test: {
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        globals: true,
        environment: "jsdom",
        setupFiles: ["vitest.setup.ts"],
        clearMocks: true,
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/test-utils/**", "src/index.tsx", "src/reportWebVitals.ts"],
            reporter: ["text", "lcov", "html"],
        },
    },
});
