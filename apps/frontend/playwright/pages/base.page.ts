import type { Page } from "@playwright/test";

/**
 * Base class for all Page Objects.
 * Provides common helpers like getting the CSRF token.
 */
export abstract class BasePage {
    constructor(protected readonly page: Page) {}

    async getCsrfToken(): Promise<string> {
        return (await this.page.evaluate(() => localStorage.getItem("csrfToken")))!;
    }

    async navigate(path: string): Promise<void> {
        await this.page.goto(path);
    }
}

