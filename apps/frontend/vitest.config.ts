import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        // Ensure react-router and react-router-dom share a single module instance
        // so that useNavigate() works inside a MemoryRouter in tests.
        dedupe: ["react-router", "react-router-dom", "react", "react-dom"],
    },
    test: {
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        globals: true,
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                url: "http://localhost",
            },
        },
        clearMocks: true,
        // Spies created with vi.spyOn() mutate the shared hook modules. With
        // isolate: false every test file runs against the same module registry,
        // so without restoring them a spy survives until some other file happens
        // to overwrite it. Test files must therefore install their spies in
        // beforeEach, not at module load.
        restoreMocks: true,
        pool: "threads",
        isolate: false,
        maxWorkers: 1,
        coverage: {
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/test-utils/**", "src/index.tsx", "src/reportWebVitals.ts"],
            provider: "v8",
            reporter: ["text", "lcov", "html", "cobertura"],
            thresholds: {
                branches: 45,
                functions: 47,
                lines: 54,
                statements: 54,
            },
            reportsDirectory: path.resolve(import.meta.dirname, "coverage"),
        },
        globalSetup: ["vitest.global-setup.ts"],
        setupFiles: ["vitest.setup.ts"],
        typecheck: {
            tsconfig: "tsconfig.test.json",
        },
    },
});
