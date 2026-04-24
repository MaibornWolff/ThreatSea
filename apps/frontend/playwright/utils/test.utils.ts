import type { APIRequestContext } from "@playwright/test";
import { deleteAllProjects } from "./project.api.ts";
import { deleteAllCatalogs } from "./catalog.api.ts";

/**
 * Returns a unique identifier combining browser name and test ID (first 16 chars).
 */
export function browserNameTestId(browserName: string, testId: string): string {
    return `${browserName}-${testId.slice(0, 16)}`;
}

/**
 * Retrieves the CSRF token from localStorage via the page context.
 * Must be called after page.goto() so the app has loaded.
 */
export async function getCsrfToken(page: import("@playwright/test").Page): Promise<string> {
    return (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
}

/**
 * Deletes all projects and catalogs (full DB cleanup for a test user session).
 */
export async function cleanAll(request: APIRequestContext, token: string): Promise<void> {
    await deleteAllProjects(request, token);
    await deleteAllCatalogs(request, token);
}
