import type { Locator, Page } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class FooterLinksPage extends BasePage {
    readonly footerVersionLabel: Locator;
    readonly imprintLink: Locator;
    readonly privacyPolicyLink: Locator;
    readonly aboutThreatSeaLink: Locator;
    readonly aboutDialogVersionLabel: Locator;
    readonly aboutDialogRepositoryLink: Locator;
    readonly aboutDialogCloseButton: Locator;

    constructor(page: Page) {
        super(page);
        //const footerContainer = page.getByTestId("page-footer_version").locator("xpath=ancestor::div[1]");

        this.footerVersionLabel = page.getByTestId("page-footer_version");
        this.imprintLink = page.getByTestId("page-footer_imprint_link");
        this.privacyPolicyLink = page.getByTestId("page-footer_policy_link");
        this.aboutThreatSeaLink = page.getByTestId("page-footer_about_link");

        this.aboutDialogVersionLabel = page.getByTestId("about-dialog_version");
        this.aboutDialogRepositoryLink = page.locator('a[href="https://github.com/MaibornWolff/ThreatSea"]');
        this.aboutDialogCloseButton = page.getByTestId("close-button");
    }

    async gotoProjectsPage(): Promise<void> {
        await this.page.goto("/projects");
    }
}
