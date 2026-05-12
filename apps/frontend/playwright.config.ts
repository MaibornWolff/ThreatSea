import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

// Make the frontend root available to auth.setup.ts (import.meta.url resolves to cache dir in Playwright)
process.env["PLAYWRIGHT_FRONTEND_ROOT"] = __dirname;

const enableAltBrowsers =
    !!process.env["CI"] || process.env["PW_ALL_BROWSERS"] === "1" || process.env["PW_ALL_BROWSERS"] === "true";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    timeout: 40000,
    testDir: "./playwright/tests",
    /* Opt out of parallel tests on CI. */
    fullyParallel: false,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env["CI"],
    /* Retry on CI only */
    retries: process.env["CI"] ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: 1,
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
    /* Configure projects for major browsers */
    projects: [
        // Setup project
        {
            name: "setup chromium",
            use: { ...devices["Desktop Chrome"] },
            testMatch: /.*\.setup\.ts/,
            testDir: "./playwright",
            retries: 0,
        },
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                // Use prepared auth state.
                storageState: path.join(__dirname, "tmp/.auth/chromium-user.json"),
            },
            dependencies: ["setup chromium"],
        },
        ...(enableAltBrowsers
            ? [
                  {
                      name: "setup firefox",
                      use: { ...devices["Desktop Firefox"] },
                      testMatch: /.*\.setup\.ts/,
                      testDir: "./playwright",
                  },
                  {
                      name: "firefox",
                      use: {
                          ...devices["Desktop Firefox"],
                          // Use prepared auth state.
                          storageState: path.join(__dirname, "tmp/.auth/firefox-user.json"),
                      },
                      dependencies: ["setup firefox"],
                  },
                  {
                      name: "setup webkit",
                      use: { ...devices["Desktop Safari"] },
                      testMatch: /.*\.setup\.ts/,
                      testDir: "./playwright",
                  },
                  {
                      name: "webkit",
                      use: {
                          ...devices["Desktop Safari"],
                          // Use prepared auth state.
                          storageState: path.join(__dirname, "tmp/.auth/webkit-user.json"),
                      },
                      dependencies: ["setup webkit"],
                  },
              ]
            : []),
    ],
    /* Run your local dev server before starting the tests */
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env["CI"],
    },
});
