import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class ThreatsPage extends BasePage {
    readonly threatListEntries: Locator;

    constructor(page: Page) {
        super(page);
        this.threatListEntries = page.locator('[data-testid="threats-page_threats-list-entry"]');
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/threats`);
    }
}

