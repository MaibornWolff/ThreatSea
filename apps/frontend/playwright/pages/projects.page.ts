import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class ProjectsPage extends BasePage {
    readonly url = "/projects";

    // Buttons
    readonly addProjectButton: Locator;
    readonly sortByDateButton: Locator;
    readonly sortByNameButton: Locator;
    readonly ascendingSortButton: Locator;
    readonly descendingSortButton: Locator;
    readonly searchField: Locator;

    // Modal
    readonly nameInput: Locator;
    readonly descriptionInput: Locator;
    readonly catalogSelection: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;

    // Project cards
    readonly projectCards: Locator;
    readonly projectCardNames: Locator;
    readonly projectCardDescriptionExpander: Locator;
    readonly projectCardDescriptions: Locator;
    readonly actionMenuButton: Locator;
    readonly editProjectButton: Locator;
    readonly deleteProjectButton: Locator;
    readonly exportProjectButton: Locator;

    // Navigation
    readonly projectsNavButton: Locator;
    readonly catalogsNavButton: Locator;
    readonly accountButton: Locator;
    readonly accountMenuUsername: Locator;
    readonly accountMenuLogout: Locator;
    readonly confirmButton: Locator;

    constructor(page: Page) {
        super(page);
        this.addProjectButton = page.locator('[data-testid="projects-page_add-project-button"]');
        this.sortByDateButton = page.locator('[data-testid="projects-page_sort-projects-by-date-button"]');
        this.sortByNameButton = page.locator('[data-testid="projects-page_sort-projects-by-name-button"]');
        this.ascendingSortButton = page.locator('[data-testid="projects-page_ascending-projects-sort-button"]');
        this.descendingSortButton = page.locator('[data-testid="projects-page_descending-projects-sort-button"]');
        this.searchField = page.locator('[data-testid="projects-page_search-field"] input');

        this.nameInput = page.locator('[data-testid="project-creation-modal_name-input"] input');
        this.descriptionInput = page.locator(
            '[data-testid="project-creation-modal_description-input"] textarea[name="description"]'
        );
        this.catalogSelection = page.locator('[data-testid="project-creation-modal_catalog-selection"]');
        this.saveButton = page.locator('[data-testid="save-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');

        this.projectCards = page.locator('[data-testid="projects-page_project-card"]');
        this.projectCardNames = page.locator('[data-testid="projects-page_project-card_project-name"]');
        this.projectCardDescriptionExpander = page.locator(
            '[data-testid="projects-page_project-card_description-expander"]'
        );
        this.projectCardDescriptions = page.locator('[data-testid="projects-page_project-card_project-description"]');
        this.actionMenuButton = page.locator('[data-testid="projects-page_project-card_action-menu-button"]');
        this.editProjectButton = page.locator(
            '[data-testid="projects-page_project-card_action-menu_edit-project-button"]'
        );
        this.deleteProjectButton = page.locator(
            '[data-testid="projects-page_project-card_action-menu_delete-project-button"]'
        );
        this.exportProjectButton = page.locator(
            '[data-testid="projects-page_project-card_action-menu_export-project-button"]'
        );

        this.projectsNavButton = page.locator('[data-testid="navigation-header_projects-page-button"]');
        this.catalogsNavButton = page.locator('[data-testid="navigation-header_catalogs-page-button"]');
        this.accountButton = page.locator('[data-testid="navigation-header_account-button"]');
        this.accountMenuUsername = page.locator('[data-testid="account-menu_username"]');
        this.accountMenuLogout = page.locator('[data-testid="account-menu_logout-button"]');
        this.confirmButton = page.locator('[data-testid="confirm-button"]');
    }

    async goto(): Promise<void> {
        await this.page.goto(this.url);
    }

    projectCardLinkButton(link: string): Locator {
        return this.page.locator(`[data-testid="projects-page_project-card_${link}-button"]`);
    }

    projectCardNameFilter(text: string): Locator {
        return this.page.locator('[data-testid="projects-page_project-card"] p').filter({ hasText: text });
    }
}
