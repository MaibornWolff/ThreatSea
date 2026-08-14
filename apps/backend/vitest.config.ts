import "dotenv/config";
import { defineConfig } from "vitest/config";
import path from "path";

process.env["DATABASE_NAME"] = "threatsea_test";

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
                branches: 70,
                functions: 85,
                lines: 82,
                statements: 82,
            },
            reportsDirectory: path.resolve(import.meta.dirname, "coverage"),
        },
        globalSetup: ["vitest.setup.global.ts", "vitest.teardown.global.ts"],
        setupFiles: ["vitest.setup.ts"],
    },
});
