import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        setupFiles: "./setupTests.ts",
        globals: true,
        include: ["src/**/*.test.{ts,tsx}"], // or whatever you use
        // exclude playwright folder if needed:
        exclude: ["**/node_modules/**", "**/playwright/**", "**/e2e/**"],
    },
});
