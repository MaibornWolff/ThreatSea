import type { Page, Locator } from "@playwright/test";
import { BasePage } from "./base.page.ts";

export class ReportPage extends BasePage {
    readonly createPdfButton: Locator;
    readonly downloadPdfButton: Locator;
    readonly openPdfButton: Locator;
    readonly excelExportButton: Locator;

    constructor(page: Page) {
        super(page);
        this.createPdfButton = page.getByRole("button", { name: "Create PDF Document" });
        this.downloadPdfButton = page.getByRole("link", { name: "Download PDF" });
        this.openPdfButton = page.getByRole("link", { name: "Open PDF in Browser" });
        this.excelExportButton = page.getByRole("button", { name: "Click to Download Export" });
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/report`);
    }

    pageSection(label: string): Locator {
        return this.page.getByRole("switch", { name: label });
    }

    languageButton(lang: string): Locator {
        return this.page.getByRole("main").getByRole("button", { name: lang, exact: true });
    }

    sortByButton(name: string): Locator {
        return this.page.getByRole("button", { name, exact: true });
    }

    get scheduledFromInput(): Locator {
        return this.page.getByLabel("From");
    }
}
