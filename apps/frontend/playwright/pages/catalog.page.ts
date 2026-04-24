import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class CatalogPage extends BasePage {
    // Threats list
    readonly addThreatButton: Locator;
    readonly threatListEntries: Locator;
    readonly threatListEntryNames: Locator;
    readonly threatListEntryAttackers: Locator;
    readonly threatListEntryPoas: Locator;
    readonly threatDeleteButtons: Locator;
    readonly sortThreatsByNameButton: Locator;
    readonly sortThreatsByDateButton: Locator;
    readonly ascendingThreatsSortButton: Locator;
    readonly descendingThreatsSortButton: Locator;

    // Measures list
    readonly addMeasureButton: Locator;
    readonly measureListEntries: Locator;
    readonly measureListEntryNames: Locator;
    readonly measureListEntryAttackers: Locator;
    readonly measureListEntryPoas: Locator;
    readonly measureDeleteButtons: Locator;
    readonly sortMeasuresByNameButton: Locator;
    readonly sortMeasuresByDateButton: Locator;
    readonly ascendingMeasuresSortButton: Locator;
    readonly descendingMeasuresSortButton: Locator;

    // Threat creation modal inputs
    readonly threatNameInput: Locator;
    readonly threatDescriptionInput: Locator;
    readonly threatAttackerSelection: Locator;
    readonly threatPoaSelection: Locator;
    readonly threatProbabilityInput: Locator;
    readonly threatConfidentialitySwitch: Locator;
    readonly threatIntegritySwitch: Locator;
    readonly threatAvailabilitySwitch: Locator;

    // Measure creation modal inputs
    readonly measureNameInput: Locator;
    readonly measureDescriptionInput: Locator;
    readonly measureAttackerSelection: Locator;
    readonly measurePoaSelection: Locator;
    readonly measureProbabilityInput: Locator;
    readonly measureConfidentialitySwitch: Locator;
    readonly measureIntegritySwitch: Locator;
    readonly measureAvailabilitySwitch: Locator;

    // Shared
    readonly saveButton: Locator;
    readonly cancelButton: Locator;
    readonly confirmButton: Locator;

    // Navigation
    readonly backToCatalogsButton: Locator;
    readonly projectsNavButton: Locator;
    readonly catalogsNavButton: Locator;
    readonly membersButton: Locator;
    readonly accountButton: Locator;
    readonly accountMenuUsername: Locator;
    readonly accountMenuLogout: Locator;

    constructor(page: Page) {
        super(page);

        this.addThreatButton = page.locator('[data-testid="catalog-page_add-threat-button"]');
        this.threatListEntries = page.locator('[data-testid="catalog-page_threats-list-entry"]');
        this.threatListEntryNames = page.locator('[data-testid="catalog-page_threats-list-entry_name"]');
        this.threatListEntryAttackers = page.locator('[data-testid="catalog-page_threats-list-entry_attacker"]');
        this.threatListEntryPoas = page.locator('[data-testid="catalog-page_threats-list-entry_poa"]');
        this.threatDeleteButtons = page.locator('[data-testid="catalog-page_threats-list-entry_delete-button"]');
        this.sortThreatsByNameButton = page.locator('[data-testid="catalog-page_sort-threats-by-name-button"]');
        this.sortThreatsByDateButton = page.locator('[data-testid="catalog-page_sort-threats-by-date-button"]');
        this.ascendingThreatsSortButton = page.locator('[data-testid="catalog-page_ascending-threats-sort-button"]');
        this.descendingThreatsSortButton = page.locator('[data-testid="catalog-page_descending-threats-sort-button"]');

        this.addMeasureButton = page.locator('[data-testid="catalog-page_add-measure-button"]');
        this.measureListEntries = page.locator('[data-testid="catalog-page_measures-list-entry"]');
        this.measureListEntryNames = page.locator('[data-testid="catalog-page_measures-list-entry_name"]');
        this.measureListEntryAttackers = page.locator('[data-testid="catalog-page_measures-list-entry_attacker"]');
        this.measureListEntryPoas = page.locator('[data-testid="catalog-page_measures-list-entry_poa"]');
        this.measureDeleteButtons = page.locator('[data-testid="catalog-page_measures-list-entry_delete-button"]');
        this.sortMeasuresByNameButton = page.locator('[data-testid="catalog-page_sort-measures-by-name-button"]');
        this.sortMeasuresByDateButton = page.locator('[data-testid="catalog-page_sort-measures-by-date-button"]');
        this.ascendingMeasuresSortButton = page.locator('[data-testid="catalog-page_ascending-measures-sort-button"]');
        this.descendingMeasuresSortButton = page.locator(
            '[data-testid="catalog-page_descending-measures-sort-button"]'
        );

        this.threatNameInput = page.locator('[data-testid="catalog-threat-creation-modal_name-input"] input');
        this.threatDescriptionInput = page.locator(
            '[data-testid="catalog-threat-creation-modal_description-input"] textarea[name="description"]'
        );
        this.threatAttackerSelection = page.locator('[data-testid="catalog-threat-creation-modal_attacker-selection"]');
        this.threatPoaSelection = page.locator('[data-testid="catalog-threat-creation-modal_poa-selection"]');
        this.threatProbabilityInput = page.locator(
            '[data-testid="catalog-threat-creation-modal_probability-input"] input'
        );
        this.threatConfidentialitySwitch = page.locator(
            '[data-testid="catalog-threat-creation-modal_confidentiality-switch"]'
        );
        this.threatIntegritySwitch = page.locator('[data-testid="catalog-threat-creation-modal_integrity-switch"]');
        this.threatAvailabilitySwitch = page.locator(
            '[data-testid="catalog-threat-creation-modal_availability-switch"]'
        );

        this.measureNameInput = page.locator('[data-testid="catalog-measure-creation-modal_name-input"] input');
        this.measureDescriptionInput = page.locator(
            '[data-testid="catalog-measure-creation-modal_description-input"] textarea[name="description"]'
        );
        this.measureAttackerSelection = page.locator(
            '[data-testid="catalog-measure-creation-modal_attacker-selection"]'
        );
        this.measurePoaSelection = page.locator('[data-testid="catalog-measure-creation-modal_poa-selection"]');
        this.measureProbabilityInput = page.locator(
            '[data-testid="catalog-measure-creation-modal_probability-input"] input'
        );
        this.measureConfidentialitySwitch = page.locator(
            '[data-testid="catalog-measure-creation-modal_confidentiality-switch"]'
        );
        this.measureIntegritySwitch = page.locator('[data-testid="catalog-measure-creation-modal_integrity-switch"]');
        this.measureAvailabilitySwitch = page.locator(
            '[data-testid="catalog-measure-creation-modal_availability-switch"]'
        );

        this.saveButton = page.locator('[data-testid="save-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');
        this.confirmButton = page.locator('[data-testid="confirm-button"]');

        this.backToCatalogsButton = page.locator('[data-testid="catalog-page_back-to-catalogs-button"]');
        this.projectsNavButton = page.locator('[data-testid="navigation-header_projects-page-button"]');
        this.catalogsNavButton = page.locator('[data-testid="navigation-header_catalogs-page-button"]');
        this.membersButton = page.locator('[data-testid="navigation-header_members-button"]');
        this.accountButton = page.locator('[data-testid="navigation-header_account-button"]');
        this.accountMenuUsername = page.locator('[data-testid="account-menu_username"]');
        this.accountMenuLogout = page.locator('[data-testid="account-menu_logout-button"]');
    }

    async goto(catalogId: number): Promise<void> {
        await this.page.goto(`/catalogs/${catalogId}`);
    }

    /** Attacker option inside threat or measure modal. Type = "threat" | "measure" */
    attackerOption(testId: string, type: "threat" | "measure"): Locator {
        return this.page.locator(`[data-testid="${testId.replace("*", type)}"]`);
    }

    /** POA option inside threat or measure modal. Type = "threat" | "measure" */
    poaOption(testId: string, type: "threat" | "measure"): Locator {
        return this.page.locator(`[data-testid="${testId.replace("*", type)}"]`);
    }

    /** Filter button on catalog page (attacker or POA filter) */
    filterButton(testId: string): Locator {
        return this.page.locator(`[data-testid="${testId}"]`);
    }
}
