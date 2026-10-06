import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test("authenticate", async ({ page, browserName }) => {
    // PLAYWRIGHT_FRONTEND_ROOT is set in playwright.config.ts (avoids import.meta.url cache dir issues)
    const frontendRoot = process.env["PLAYWRIGHT_FRONTEND_ROOT"]!;
    const authDir = path.join(frontendRoot, "tmp", ".auth");
    const authFile = path.join(authDir, `${browserName}-user.json`);

    fs.mkdirSync(authDir, { recursive: true });

    let accountId;
    switch (browserName) {
        case "chromium":
            accountId = "2";
            break;
        case "firefox":
            accountId = "3";
            break;
        case "webkit":
            accountId = "4";
            break;
        default:
            throw new Error(`No fixed login profile is mapped to browser "${browserName}".`);
    }

    // Login via backend — follows the redirect to the frontend origin (backend ORIGIN_APP,
    // which must match the base URL resolved in playwright.config.ts).
    const frontendBaseUrl = process.env["PW_RESOLVED_BASE_URL"] ?? "http://localhost:3000";
    await page.goto(`${process.env["API_URI"]}/api/auth/login?testUser=${accountId}`);
    await page.waitForURL(`${frontendBaseUrl}/**`, { timeout: 15000 });

    // A failed fixed-auth login still redirects to the frontend (to /login?failure), and the
    // csrfToken below is scoped to the express session, not the identity — so only the
    // accessToken cookie proves this browser is actually logged in.
    const cookieNames = (await page.context().cookies()).map((cookie) => cookie.name);
    expect(cookieNames, `testUser=${accountId} did not log in`).toContain("accessToken");

    // Navigate to /projects — initializes the app, which writes csrfToken to localStorage
    // asynchronously (App mount effect -> startTokenRefresh). Poll for the token instead of
    // reading once after networkidle, which can settle before that async write completes.
    await page.goto("/projects");
    const csrfTokenHandle = await page.waitForFunction(() => localStorage.getItem("csrfToken"), null, {
        timeout: 15000,
    });
    const csrfToken = await csrfTokenHandle.jsonValue();
    expect(csrfToken).toBeTruthy();

    await page.context().storageState({ path: authFile });
});
