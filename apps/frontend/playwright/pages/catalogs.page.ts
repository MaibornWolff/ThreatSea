import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class CatalogsPage extends BasePage {
    readonly url = "/catalogs";

    readonly addCatalogButton: Locator;
    readonly catalogListEntries: Locator;
    readonly catalogListEntryNames: Locator;
    readonly emptyCheckbox: Locator;
    readonly sortByDateButton: Locator;
    readonly sortByNameButton: Locator;
    readonly ascendingSortButton: Locator;
    readonly descendingSortButton: Locator;
    readonly nameInput: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;
    readonly confirmButton: Locator;
    readonly accountButton: Locator;
    readonly accountMenuUsername: Locator;
    readonly accountMenuLogout: Locator;
    readonly projectsNavButton: Locator;
    readonly catalogsNavButton: Locator;

    constructor(page: Page) {
        super(page);
        this.addCatalogButton = page.locator('[data-testid="catalogs-page_add-catalog-button"]');
        this.catalogListEntries = page.locator('[data-testid="catalogs-page_catalogs-list-entry"]');
        this.catalogListEntryNames = page.locator('[data-testid="catalogs-page_catalogs-list-entry_name"] p');
        this.emptyCheckbox = page.locator('[data-testid="catalog-creation-modal_empty-checkbox"]');
        this.sortByDateButton = page.locator('[data-testid="catalogs-page_sort-catalogs-by-date-button"]');
        this.sortByNameButton = page.locator('[data-testid="catalogs-page_sort-catalogs-by-name-button"]');
        this.ascendingSortButton = page.locator('[data-testid="catalogs-page_ascending-catalogs-sort-button"]');
        this.descendingSortButton = page.locator('[data-testid="catalogs-page_descending-catalogs-sort-button"]');
        this.nameInput = page.locator('[data-testid="catalog-creation-modal_name-input"] input');
        this.saveButton = page.locator('[data-testid="save-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');
        this.confirmButton = page.locator('[data-testid="confirm-button"]');
        this.accountButton = page.locator('[data-testid="navigation-header_account-button"]');
        this.accountMenuUsername = page.locator('[data-testid="account-menu_username"]');
        this.accountMenuLogout = page.locator('[data-testid="account-menu_logout-button"]');
        this.projectsNavButton = page.locator('[data-testid="navigation-header_projects-page-button"]');
        this.catalogsNavButton = page.locator('[data-testid="navigation-header_catalogs-page-button"]');
    }

    async goto(): Promise<void> {
        await this.page.goto(this.url);
    }

    catalogEntryNameFilter(text: string): Locator {
        return this.catalogListEntryNames.filter({ hasText: text });
    }

    /** Returns the rename button for the entry row that matches the given name filter. */
    renameCatalogButton(nameFilter: string): Locator {
        return this.catalogEntryNameFilter(nameFilter)
            .first()
            .locator("..").locator("..").locator("..")
            .locator('[data-testid="catalogs-page_rename-catalog-button"]');
    }

    /** Returns the delete button for the entry row that matches the given name filter. */
    deleteCatalogButton(nameFilter: string): Locator {
        return this.catalogEntryNameFilter(nameFilter)
            .first()
            .locator("..").locator("..").locator("..")
            .locator('[data-testid="catalogs-page_catalogs-list-entry_delete-button"]');
    }
}
