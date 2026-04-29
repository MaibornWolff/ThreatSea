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

    // Navigate to /projects — initializes the app and writes csrfToken to localStorage.
    await page.goto("/projects");
    await page.waitForLoadState("networkidle");
    const csrfToken = await page.evaluate(() => localStorage.getItem("csrfToken"));
    expect(csrfToken).toBeTruthy();

    await page.context().storageState({ path: authFile });
});
