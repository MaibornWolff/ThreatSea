import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    test: {
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        globals: true,
        environment: "jsdom",
        clearMocks: true,
        pool: "threads",
        isolate: false,
        maxWorkers: 1,
        coverage: {
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/test-utils/**", "src/index.tsx", "src/reportWebVitals.ts"],
            provider: "v8",
            reporter: ["text", "lcov", "html", "cobertura"],
            reportsDirectory: path.resolve(__dirname, "coverage"),
        },
        setupFiles: ["vitest.setup.ts"],
        typecheck: {
            tsconfig: "tsconfig.test.json",
        },
    },
});
