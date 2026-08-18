import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class FooterLinksPage extends BasePage {
    readonly footerVersionLabel: Locator;
    readonly imprintLink: Locator;
    readonly privacyPolicyLink: Locator;
    readonly aboutThreatSeaButton: Locator;
    readonly aboutDialogVersionLabel: Locator;
    readonly aboutDialogRepositoryLink: Locator;
    readonly aboutDialogCloseButton: Locator;

    constructor(page: Page) {
        super(page);
        const footerContainer = page.getByTestId("page-footer_version").locator("xpath=ancestor::div[1]");

        this.footerVersionLabel = page.getByTestId("page-footer_version");
        this.imprintLink = footerContainer.locator('a[href="/imprint"]');
        this.privacyPolicyLink = footerContainer.locator('a[href="/privacy-policy"]');
        this.aboutThreatSeaButton = footerContainer.locator('button[type="button"]');

        this.aboutDialogVersionLabel = page.getByTestId("about-dialog_version");
        this.aboutDialogRepositoryLink = page.locator('a[href="https://github.com/MaibornWolff/ThreatSea"]');
        this.aboutDialogCloseButton = page.getByTestId("close-button");
    }

    async gotoProjectsPage(): Promise<void> {
        await this.page.goto("/projects");
    }
}
