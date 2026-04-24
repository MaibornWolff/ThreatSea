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
    await page.goto(`${process.env["API_URI"]}/api/auth/login?testUser=${accountId}`);

    // Validate the session
    await page.goto("/projects");
    await page.waitForURL(/\/projects/, { timeout: 30000 });
    await expect(page.locator('[data-testid="navigation-header_account-button"]')).toBeVisible({ timeout: 30000 });

    await page.context().storageState({ path: authFile });
});
