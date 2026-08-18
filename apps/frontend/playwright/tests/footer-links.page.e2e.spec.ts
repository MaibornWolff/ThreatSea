import { test, expect } from "@playwright/test";
import { FooterLinksPage } from "../pages/footer-links.page.ts";

test.describe("Footer links regression tests", () => {
    test.beforeEach(async ({ page }) => {
        const footerLinksPage = new FooterLinksPage(page);
        await footerLinksPage.gotoProjectsPage();
        await expect(footerLinksPage.footerVersionLabel).toBeVisible();
    });

    test("opens imprint page from footer", async ({ page }) => {
        const footerLinksPage = new FooterLinksPage(page);

        await expect(footerLinksPage.imprintLink).toBeVisible();
        await footerLinksPage.imprintLink.click();

        await expect(page).toHaveURL(/\/imprint$/);
        await expect(footerLinksPage.footerVersionLabel).toBeVisible();
    });

    test("opens privacy policy page from footer", async ({ page }) => {
        const footerLinksPage = new FooterLinksPage(page);

        await expect(footerLinksPage.privacyPolicyLink).toBeVisible();
        await footerLinksPage.privacyPolicyLink.click();

        await expect(page).toHaveURL(/\/privacy-policy$/);
        await expect(footerLinksPage.footerVersionLabel).toBeVisible();
    });

    test("opens and closes the about dialog from footer", async ({ page }) => {
        const footerLinksPage = new FooterLinksPage(page);

        await expect(footerLinksPage.aboutThreatSeaButton).toBeVisible();
        await footerLinksPage.aboutThreatSeaButton.click();

        await expect(footerLinksPage.aboutDialogVersionLabel).toBeVisible();
        await expect(footerLinksPage.aboutDialogRepositoryLink).toBeVisible();

        await footerLinksPage.aboutDialogCloseButton.click();
        await expect(footerLinksPage.aboutDialogVersionLabel).toBeHidden();
    });
});
