import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class MeasuresPage extends BasePage {
    readonly addMeasureButton: Locator;
    readonly measureListEntries: Locator;
    readonly measureListEntryNames: Locator;
    readonly measureListEntryScheduledAt: Locator;
    readonly measureCopyButtons: Locator;
    readonly measureDeleteButtons: Locator;
    readonly sortByNameButton: Locator;
    readonly sortByScheduledAtButton: Locator;

    readonly nameInput: Locator;
    readonly descriptionInput: Locator;
    readonly scheduledAtInput: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;
    readonly confirmButton: Locator;

    readonly projectsNavButton: Locator;
    readonly catalogsNavButton: Locator;
    readonly accountButton: Locator;
    readonly accountMenuUsername: Locator;
    readonly accountMenuLogout: Locator;

    constructor(page: Page) {
        super(page);
        this.addMeasureButton = page.locator('[data-testid="measures-page_add-measure-button"]');
        this.measureListEntries = page.locator('[data-testid="measures-page_measures-list-entry"]');
        this.measureListEntryNames = page.locator('[data-testid="measures-page_measures-list-entry_name"]');
        this.measureListEntryScheduledAt = page.locator(
            '[data-testid="measures-page_measures-list-entry_scheduled-at"]'
        );
        this.measureCopyButtons = page.locator('[data-testid="measures-page_measures-list-entry_copy-button"]');
        this.measureDeleteButtons = page.locator('[data-testid="measures-page_measures-list-entry_delete-button"]');
        // Sorting happens via the DataGrid column headers; the header element carries
        // aria-sort and toggles the sort on click (the filter toggle inside it stops
        // propagation, so it does not interfere).
        this.sortByNameButton = page.locator('.MuiDataGrid-columnHeader[data-field="name"]');
        this.sortByScheduledAtButton = page.locator('.MuiDataGrid-columnHeader[data-field="scheduledAt"]');
        // (Click sorting goes through toggleSort(), which targets the header label —
        // center-clicking the header element can hit the filter toggle instead.)

        this.nameInput = page.locator('[data-testid="measure-creation-modal_name-input"] textarea[name="name"]');
        this.descriptionInput = page.locator(
            '[data-testid="measure-creation-modal_description-input"] textarea[name="description"]'
        );
        this.scheduledAtInput = page.locator('[data-testid="measure-creation-modal_scheduled-at-input"] input');
        this.saveButton = page.locator('[data-testid="save-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');
        this.confirmButton = page.locator('[data-testid="confirm-button"]');

        this.projectsNavButton = page.locator('[data-testid="navigation-header_projects-page-button"]');
        this.catalogsNavButton = page.locator('[data-testid="navigation-header_catalogs-page-button"]');
        this.accountButton = page.locator('[data-testid="navigation-header_account-button"]');
        this.accountMenuUsername = page.locator('[data-testid="account-menu_username"]');
        this.accountMenuLogout = page.locator('[data-testid="account-menu_logout-button"]');
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/measures`);
    }

    projectNavButton(link: string): Locator {
        return this.page.locator(`[data-testid="navigation-header_${link}-button"]`);
    }

    /**
     * Toggles a column's sort by clicking its header label. Clicking the header element
     * itself is unreliable: its center can hit the filter toggle (which stops propagation).
     */
    async toggleSort(field: string): Promise<void> {
        await this.page.locator(`.MuiDataGrid-columnHeader[data-field="${field}"] p`).first().click();
    }
}
