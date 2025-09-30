import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    timeout: 60000,
    testDir: "./tests",
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env["CI"],
    /* Retry on CI only */
    retries: process.env["CI"] ? 2 : 1,
    /* Opt out of parallel tests on CI. */
    workers: process.env["CI"] ? 1 : 3,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: "html",
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: "http://localhost:3000", // Base URL for the application being tested
        screenshot: "only-on-failure", // Take screenshots only on test failure

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
        video: "on-first-retry",
    },
    globalSetup: "./playwright.global.setup.ts",
    globalTeardown: "./playwright.global.teardown.ts",
    /* Configure projects for major browsers */
    projects: [
        // Setup project
        {
            name: "setup chromium",
            use: {
                ...devices["Desktop Chrome"],
            },
            testMatch: /.*\.setup\.ts/,
        },
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                // Use prepared auth state.
                storageState: "tmp/.auth/chromium-user.json",
            },
            dependencies: ["setup chromium"],
        },
        {
            name: "setup firefox",
            use: {
                ...devices["Desktop Firefox"],
            },
            testMatch: /.*\.setup\.ts/,
        },
        {
            name: "firefox",
            use: {
                ...devices["Desktop Firefox"],
                // Use prepared auth state.
                storageState: "tmp/.auth/firefox-user.json",
            },
            dependencies: ["setup firefox"],
        },
        {
            name: "setup webkit",
            use: {
                ...devices["Desktop Safari"],
            },
            testMatch: /.*\.setup\.ts/,
        },
        {
            name: "webkit",
            use: {
                ...devices["Desktop Safari"],
                // Use prepared auth state.
                storageState: "tmp/.auth/webkit-user.json",
            },
            dependencies: ["setup webkit"],
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env["CI"],
    },
});
