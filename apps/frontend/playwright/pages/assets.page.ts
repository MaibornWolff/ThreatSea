import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class AssetsPage extends BasePage {
    readonly addAssetButton: Locator;
    readonly assetListEntries: Locator;
    readonly assetListEntryNames: Locator;
    readonly sortByNameButton: Locator;
    readonly sortByDateButton: Locator;

    readonly nameInput: Locator;
    readonly descriptionInput: Locator;
    readonly confidentialityInput: Locator;
    readonly integrityInput: Locator;
    readonly availabilityInput: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;
    readonly confirmButton: Locator;
    readonly deleteButtons: Locator;

    readonly projectsNavButton: Locator;
    readonly catalogsNavButton: Locator;
    readonly accountButton: Locator;
    readonly accountMenuUsername: Locator;
    readonly accountMenuLogout: Locator;

    constructor(page: Page) {
        super(page);
        this.addAssetButton = page.locator('[data-testid="assets-page_add-asset-button"]');
        this.assetListEntries = page.locator('[data-testid="assets-page_assets-list-entry"]');
        this.assetListEntryNames = page.locator('[data-testid="assets-page_assets-list-entry_name"]');
        this.sortByNameButton = page.locator('[data-testid="assets-page_sort-assets-by-name-button"]');
        this.sortByDateButton = page.locator('[data-testid="assets-page_sort-assets-by-date-button"]');

        this.nameInput = page.locator('[data-testid="asset-creation-modal_name-input"] input');
        this.descriptionInput = page.locator(
            '[data-testid="asset-creation-modal_description-input"] textarea[name="description"]'
        );
        this.confidentialityInput = page.locator('[data-testid="asset-creation-modal_confidentiality-input"] input');
        this.integrityInput = page.locator('[data-testid="asset-creation-modal_integrity-input"] input');
        this.availabilityInput = page.locator('[data-testid="asset-creation-modal_availability-input"] input');
        this.saveButton = page.locator('[data-testid="save-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');
        this.confirmButton = page.locator('[data-testid="confirm-button"]');
        this.deleteButtons = page.locator('[data-testid="assets-page_assets-list-entry_delete-button"]');

        this.projectsNavButton = page.locator('[data-testid="navigation-header_projects-page-button"]');
        this.catalogsNavButton = page.locator('[data-testid="navigation-header_catalogs-page-button"]');
        this.accountButton = page.locator('[data-testid="navigation-header_account-button"]');
        this.accountMenuUsername = page.locator('[data-testid="account-menu_username"]');
        this.accountMenuLogout = page.locator('[data-testid="account-menu_logout-button"]');
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/assets`);
    }

    sortByCiaButton(attribute: string): Locator {
        return this.page.locator(`[data-testid="assets-page_sort-assets-by-${attribute}-button"]`);
    }

    assetListEntryCia(attribute: string): Locator {
        return this.page.locator(`[data-testid="assets-page_assets-list-entry_${attribute}"]`);
    }

    projectNavButton(link: string): Locator {
        return this.page.locator(`[data-testid="navigation-header_${link}-button"]`);
    }
}
