import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        include: ["./tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
        globals: true,
        environment: "node",
        clearMocks: true,
        coverage: {
            include: ["src"],
            provider: "v8",
            reporter: ["text", "lcov", "html", "cobertura"],
            thresholds: {
                branches: 65,
                functions: 75,
                lines: 70,
                statements: 70,
            },
            reportsDirectory: path.resolve(__dirname, "coverage"),
        },
        globalSetup: ["vitest.setup.global.ts", "vitest.teardown.global.ts"],
        setupFiles: ["vitest.setup.ts"],
    },
});
