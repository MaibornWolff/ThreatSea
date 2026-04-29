import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

// Make the frontend root available to auth.setup.ts (import.meta.url resolves to cache dir in Playwright)
process.env["PLAYWRIGHT_FRONTEND_ROOT"] = __dirname;

export default defineConfig({
    timeout: 40000,
    testDir: "./playwright/tests",
    fullyParallel: false,
    forbidOnly: !!process.env["CI"],
    retries: process.env["CI"] ? 2 : 0,
    workers: 1,
    reporter: "html",
    use: {
        baseURL: "http://localhost:3000",
        screenshot: "only-on-failure",
        trace: "on-first-retry",
        video: "on-first-retry",
    },
    projects: [
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
                storageState: path.join(__dirname, "tmp/.auth/chromium-user.json"),
            },
            dependencies: ["setup chromium"],
        },
        /*
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
                storageState: path.join(__dirname, "tmp/.auth/webkit-user.json"),
            },
            dependencies: ["setup webkit"],
        },
        */
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env["CI"],
    },
});
