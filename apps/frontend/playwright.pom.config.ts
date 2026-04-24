import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

/**
 * Playwright config for the refactored POM-based test structure under playwright/tests/.
 */
export default defineConfig({
    timeout: 60000,
    testDir: "./playwright/tests",
    forbidOnly: !!process.env["CI"],
    retries: process.env["CI"] ? 2 : 1,
    workers: process.env["CI"] ? 1 : 3,
    reporter: "html",
    use: {
        baseURL: "http://localhost:3000",
        screenshot: "only-on-failure",
        trace: "on-first-retry",
        video: "on-first-retry",
    },
    globalSetup: "./playwright.global.setup.ts",
    globalTeardown: "./playwright.global.teardown.ts",
    projects: [
        {
            name: "setup chromium",
            use: { ...devices["Desktop Chrome"] },
            testMatch: /.*\.setup\.ts/,
            testDir: "./tests", // auth.setup.ts liegt noch in ./tests
        },
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                storageState: path.join(__dirname, "tmp/.auth/chromium-user.json"),
            },
            dependencies: ["setup chromium"],
        },
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env["CI"],
    },
});

