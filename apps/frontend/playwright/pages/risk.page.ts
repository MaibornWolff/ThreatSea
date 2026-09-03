import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

/**
 * Page Object for the Risk page: the risk matrix, the sortable/searchable threat list, the
 * selected threat's applied measures, the measure timeline, the line-of-tolerance control, and
 * the "Apply Measure" dialog (including its nested "create new measure" dialog).
 */
export class RiskPage extends BasePage {
    // Threat list: search, sort, rows
    readonly threatSearchField: Locator;
    readonly sortByNameButton: Locator;
    readonly threatRows: Locator;
    readonly threatNameCells: Locator;

    // Selected threat's applied measures
    readonly applyMeasureButton: Locator;
    readonly appliedMeasureRows: Locator;

    // Line of tolerance & measure timeline
    readonly lineOfToleranceThumbs: Locator;
    readonly timelineThumb: Locator;

    // "Apply Measure" dialog
    readonly measureSelect: Locator;
    readonly addNewMeasureButton: Locator;
    readonly descriptionInput: Locator;
    readonly impactsDamageCheckbox: Locator;
    readonly damageInput: Locator;
    readonly applyMeasureSaveButton: Locator;
    readonly dialogs: Locator;
    readonly measureRequiredError: Locator;
    readonly damageRequiredError: Locator;
    readonly damageMaxError: Locator;

    // Nested "create new measure" dialog (opened from within "Apply Measure")
    readonly newMeasureNameInput: Locator;
    readonly newMeasureDescriptionInput: Locator;
    readonly newMeasureScheduledAtInput: Locator;

    // Generic dialog actions shared across the app (the "Apply Measure" dialog's own save button
    // is dialog-scoped instead, since it and the nested "create new measure" dialog can be open
    // at the same time).
    readonly saveButton: Locator;
    readonly confirmButton: Locator;

    constructor(page: Page) {
        super(page);

        this.threatSearchField = page.locator('[data-testid="risk-page_threat-search-input"] input');
        this.sortByNameButton = page.locator('[data-testid="risk-page_sort-threats-by-name-button"]');
        this.threatRows = page.locator('[data-testid="risk-page_threat-list-entry"]');
        this.threatNameCells = page.locator('[data-testid="risk-page_threat-list-entry_name"]');

        this.applyMeasureButton = page.locator('[data-testid="risk-page_apply-measure-button"]');
        this.appliedMeasureRows = page.locator('[data-testid="risk-page_applied-measure-list-entry"]');

        // MUI's slider thumb is a native <input type="range">, so its "slider" ARIA role is
        // implicit (from the input type), not a literal `role` attribute — getByRole resolves
        // that correctly, a `[role="slider"]` CSS attribute selector never would.
        this.lineOfToleranceThumbs = page.getByTestId("risk-page_line-of-tolerance-slider").getByRole("slider");
        this.timelineThumb = page.getByTestId("risk-page_measure-timeline-slider").getByRole("slider");

        // MUI puts the interactive combobox (and its aria-disabled state) on an inner element,
        // not on the root the data-testid sits on.
        this.measureSelect = page.locator('[data-testid="apply-measure-modal_measure-select"] [role="combobox"]');
        this.addNewMeasureButton = page.locator('[data-testid="apply-measure-modal_add-new-measure-button"]');
        this.descriptionInput = page.locator(
            '[data-testid="apply-measure-modal_description-input"] textarea[name="description"]'
        );
        this.impactsDamageCheckbox = page.locator('[data-testid="apply-measure-modal_impacts-damage-checkbox"]');
        this.damageInput = page.locator('[data-testid="apply-measure-modal_damage-input"] input');
        this.applyMeasureSaveButton = page.locator('[data-testid="apply-measure-modal_save-button"]');
        this.dialogs = page.getByRole("dialog");
        this.measureRequiredError = page.getByText("Measure required");
        this.damageRequiredError = page.getByText("Damage required");
        this.damageMaxError = page.getByText("Damage must be 5 or smaller");

        this.newMeasureNameInput = page.locator(
            '[data-testid="measure-creation-modal_name-input"] textarea[name="name"]'
        );
        this.newMeasureDescriptionInput = page.locator(
            '[data-testid="measure-creation-modal_description-input"] textarea[name="description"]'
        );
        this.newMeasureScheduledAtInput = page.locator(
            '[data-testid="measure-creation-modal_scheduled-at-input"] input'
        );

        this.saveButton = page.locator('[data-testid="save-button"]');
        this.confirmButton = page.locator('[data-testid="confirm-button"]');
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/risk`);
    }

    /** Row in the threat list whose name contains the given text. */
    threatRow(name: string): Locator {
        return this.threatRows.filter({ hasText: name });
    }

    /** Risk value cell for the threat row with the given name. */
    riskCellFor(name: string): Locator {
        return this.threatRow(name).locator('[data-testid="risk-page_threat-list-entry_risk"]');
    }

    /** Selects a threat row, which loads its applied measures into the side panel. */
    async selectThreat(name: string): Promise<void> {
        await this.threatRow(name).click();
    }

    /** Attempts to open the edit dialog for a threat's details (Editor/Owner only). */
    async editThreat(name: string): Promise<void> {
        await this.threatRow(name).locator('[data-testid="risk-page_threat-list-entry_name"]').click();
    }

    /** Matrix cell for the given (probability, damage) coordinates. */
    matrixCell(probability: number, damage: number): Locator {
        return this.page.getByTestId(`risk-matrix_cell-${probability}-${damage}`);
    }

    /** Row of an already-applied measure, identified by its name. */
    appliedMeasureRow(name: string): Locator {
        return this.appliedMeasureRows.filter({ hasText: name });
    }

    /**
     * Opens the "Apply Measure" dialog pre-filled with an applied measure's impact (description,
     * probability/damage). Clicks the row's scheduled-at cell, since the name and the unapply
     * button each have their own, different click target on the same row.
     */
    async editMeasureImpact(measureName: string): Promise<void> {
        await this.appliedMeasureRow(measureName)
            .locator('[data-testid="risk-page_applied-measure-list-entry_scheduled-at"]')
            .click();
    }

    /** Unapply (delete) icon button for an applied measure's row. */
    unapplyButtonFor(measureName: string): Locator {
        return this.appliedMeasureRow(measureName).getByRole("button");
    }

    /** Picks an already-existing project measure from the "Apply Measure" dialog's dropdown. */
    async selectExistingMeasure(name: string): Promise<void> {
        await this.measureSelect.click();
        await this.page.getByRole("option").filter({ hasText: name }).click();
    }

    /** Fills and saves the nested "create new measure" dialog opened from "Apply Measure". */
    async createNewMeasure({
        name,
        description,
        scheduledAt,
    }: {
        name: string;
        description: string;
        scheduledAt: string;
    }): Promise<void> {
        await this.newMeasureNameInput.fill(name);
        await this.newMeasureDescriptionInput.fill(description);
        await this.newMeasureScheduledAtInput.fill(scheduledAt);
        await this.saveButton.click();
    }

    /** Moves the measure timeline forward by the given number of scheduled-measure marks. */
    async moveTimelineForward(steps = 1): Promise<void> {
        await this.timelineThumb.focus();
        for (let i = 0; i < steps; i++) {
            await this.page.keyboard.press("ArrowRight");
        }
    }

    /** Resets the measure timeline back to its "Start" mark. */
    async moveTimelineToStart(): Promise<void> {
        await this.timelineThumb.focus();
        await this.page.keyboard.press("Home");
    }
}
