import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class ThreatsPage extends BasePage {
    readonly genericThreatListEntries: Locator;
    readonly genericThreatListEntryNames: Locator;
    readonly threatListEntries: Locator;
    readonly threatListEntryNames: Locator;
    readonly threatListEntryComponents: Locator;
    readonly searchInput: Locator;
    readonly confirmButton: Locator;
    readonly cancelButton: Locator;

    constructor(page: Page) {
        super(page);
        this.genericThreatListEntries = page.locator('[data-testid="threats-page_generic-threats-list-entry"]');
        this.genericThreatListEntryNames = page.locator('[data-testid="threats-page_generic-threats-list-entry_name"]');
        this.threatListEntries = page.locator('[data-testid="threats-page_threats-list-entry"]');
        this.threatListEntryNames = page.locator('[data-testid="threats-page_threats-list-entry_name"]');
        this.threatListEntryComponents = page.locator('[data-testid="threats-page_threats-list-entry_component"]');
        this.searchInput = page.locator('[data-testid="ThreatSearch"] input');
        this.confirmButton = page.locator('[data-testid="confirm-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/threats`);
    }

    /**
     * A generic threat list entry identified by name and component: the same catalogue threat on two
     * components produces two generic threats sharing a name, which only the component tells apart.
     */
    genericThreatListEntry(name: string, componentName: string): Locator {
        return this.genericThreatListEntries
            .filter({
                has: this.page.locator('[data-testid="threats-page_generic-threats-list-entry_name"]', {
                    hasText: name,
                }),
            })
            .filter({
                has: this.page.locator('[data-testid="threats-page_generic-threats-list-entry_component"]', {
                    hasText: componentName,
                }),
            });
    }

    threatListEntry(name: string): Locator {
        return this.threatListEntries.filter({
            has: this.page.locator('[data-testid="threats-page_threats-list-entry_name"]', { hasText: name }),
        });
    }

    toggleButton(genericThreatListEntry: Locator): Locator {
        return genericThreatListEntry.getByRole("button", { name: /Expand|Collapse/ });
    }

    addThreatButton(genericThreatListEntry: Locator): Locator {
        return genericThreatListEntry.getByRole("button", { name: "Add Threat" });
    }

    editThreatButton(threatListEntry: Locator): Locator {
        return threatListEntry.getByRole("button", { name: "Edit Threat" });
    }

    duplicateThreatButton(threatListEntry: Locator): Locator {
        return threatListEntry.getByRole("button", { name: "Duplicate Threat" });
    }

    deleteThreatButton(threatListEntry: Locator): Locator {
        return threatListEntry.getByRole("button", { name: "Delete Threat" });
    }
}
