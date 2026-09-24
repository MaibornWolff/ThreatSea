import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class ThreatsPage extends BasePage {
    readonly threatListEntries: Locator;
    readonly threatListEntryNames: Locator;
    readonly sortByNameButton: Locator;

    constructor(page: Page) {
        super(page);
        this.threatListEntries = page.locator('[data-testid="threats-page_threats-list-entry"]');
        this.threatListEntryNames = page.locator('[data-testid="threats-page_threats-list-entry_name"]');
        // The DataGrid column header carries aria-sort and toggles the sort on click.
        this.sortByNameButton = page.locator('.MuiDataGrid-columnHeader[data-field="name"]');
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/threats`);
    }

    /**
     * Toggles a column's sort by clicking its header label. Clicking the header element
     * itself is unreliable: its center can hit the filter toggle (which stops propagation).
     */
    async toggleSort(field: string): Promise<void> {
        await this.page.locator(`.MuiDataGrid-columnHeader[data-field="${field}"] p`).first().click();
    }
}
