import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("authenticate", async ({ page, browserName }) => {
    const authFile = path.join(__dirname, `../tmp/.auth/${browserName}-user.json`);
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
    await page.goto(`${process.env["API_URI"]}/auth/login?testUser=${accountId}`);

    // Validate the session
    await page.goto("/login");
    await page.click('[data-testid="navigation-header_account-button"]');
    await expect(page.locator('[data-testid="account-menu_username"]')).toContainText("E2E\nTesting");

    // End of authentication steps.

    await page.context().storageState({ path: authFile });
});
