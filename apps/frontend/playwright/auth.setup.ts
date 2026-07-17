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
    }

    // Login via backend — follows redirect to http://localhost:3000
    await page.goto(`${process.env["API_URI"]}/api/auth/login?testUser=${accountId}`);
    await page.waitForURL("http://localhost:3000/**", { timeout: 15000 });

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
