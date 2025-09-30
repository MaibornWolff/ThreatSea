import { test, expect, type Page } from "@playwright/test";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { getProjects, importProject, deleteProject, deleteCatalog } from "./test-utils.ts";
import threatsFixture from "./fixtures/threats.json" with { type: "json" };

async function addCommunication(page: Page) {
    await page
        .locator("canvas")
        .nth(2)
        .click({ position: { x: 885, y: 370 } });
    await page.getByTestId("create-communication-button").click();
    await page.locator('[data-testid="communication-name"] input').fill("Sample Communication");
    await page.getByTestId("communication-icon").click();
    await page.getByTestId("WifiIcon").click();
    await page.getByTestId("save-communication").click();
}

let exportedProject: {
    project: Omit<ExtendedProject, "image" | "confidentialityLevel">;
};
let projectId: number;

test.beforeAll(async () => {
    exportedProject = {
        ...threatsFixture.project,
        project: {
            ...threatsFixture.project.project,
            createdAt: new Date(threatsFixture.project.project.createdAt),
            updatedAt: new Date(threatsFixture.project.project.updatedAt),
        },
    };
});

test.beforeEach(async ({ page, request }) => {
    await page.goto("/projects");
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
    await importProject(request, token, exportedProject);
    const projects = await getProjects(request, token);
    projectId = projects.find((project) => project.name === exportedProject.project.name)!.id;

    await page.goto(`/projects/${projectId}/system`);
});

test.afterEach(async ({ page, request }) => {
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const projects = await getProjects(request, token);
    const project = projects.find((project) => project.name === exportedProject.project.name)!;
    await deleteProject(request, token, project.id);

    await deleteCatalog(request, token, project.catalogId);
});

test.describe("Editor Page Tests", () => {
    test.describe("Component Sidebar Tests", () => {
        test("Performs case insensitive search", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 500, y: 340 } });
            await page.locator('[data-testid="selected-component-asset-search-field"] input').fill("SAMPLE ASSET");

            const results = page.getByTestId("selected-component-asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Performs substring search", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 500, y: 340 } });
            await page.locator('[data-testid="selected-component-asset-search-field"] input').fill("Asset");

            const results = page.getByTestId("selected-component-asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 500, y: 340 } });
            await page.locator('[data-testid="selected-component-asset-search-field"] input').fill("aSSeT");

            const results = page.getByTestId("selected-component-asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Handles one search result gracefully", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 500, y: 340 } });
            await page.locator('[data-testid="selected-component-asset-search-field"] input').fill("Sample Asset 1");

            const results = page.getByTestId("selected-component-asset-search-results");
            await expect(results).toHaveCount(1);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 500, y: 340 } });
            await page.locator('[data-testid="selected-component-asset-search-field"] input').fill("NonExistent");

            const results = page.getByTestId("selected-component-asset-search-results");
            await expect(results).toHaveCount(0);
        });
    });

    test.describe("Point Of Attack Sidebar Tests", () => {
        test("Performs case insensitive search", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 822, y: 340 } });
            await page
                .locator('[data-testid="selected-point-of-attack-asset-search-field"] input')
                .fill("SAMPLE ASSET");

            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Performs substring search", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 822, y: 340 } });
            await page.locator('[data-testid="selected-point-of-attack-asset-search-field"] input').fill("Asset");

            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 822, y: 340 } });
            await page.locator('[data-testid="selected-point-of-attack-asset-search-field"] input').fill("aSSeT");

            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Handles one search result gracefully", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 822, y: 340 } });
            await page
                .locator('[data-testid="selected-point-of-attack-asset-search-field"] input')
                .fill("Sample Asset 1");

            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(1);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 822, y: 340 } });
            await page.locator('[data-testid="selected-point-of-attack-asset-search-field"] input').fill("NonExistent");

            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(0);
        });
    });

    test.describe("Communication Interface Sidebar Tests", () => {
        test("Performs case insensitive search", async ({ page }) => {
            await addCommunication(page);
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 885, y: 370 } });
            await page.getByTestId("communication-list-item").click();

            await page.locator('[data-testid="selected-communication-asset-search-field"] input').fill("SAMPLE ASSET");
            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Performs substring search", async ({ page }) => {
            await addCommunication(page);
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 885, y: 370 } });
            await page.getByTestId("communication-list-item").click();

            await page.locator('[data-testid="selected-communication-asset-search-field"] input').fill("Asset");
            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            await addCommunication(page);
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 885, y: 370 } });
            await page.getByTestId("communication-list-item").click();

            await page.locator('[data-testid="selected-communication-asset-search-field"] input').fill("aSSeT");
            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(2);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
            await expect(results.nth(1)).toContainText("Sample Asset 2");
        });

        test("Handles one search result gracefully", async ({ page }) => {
            await addCommunication(page);
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 885, y: 370 } });
            await page.getByTestId("communication-list-item").click();

            await page
                .locator('[data-testid="selected-communication-asset-search-field"] input')
                .fill("Sample Asset 1");
            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(1);
            await expect(results.nth(0)).toContainText("Sample Asset 1");
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            await addCommunication(page);
            await page
                .locator("canvas")
                .nth(2)
                .click({ position: { x: 885, y: 370 } });
            await page.getByTestId("communication-list-item").click();

            await page.locator('[data-testid="selected-communication-asset-search-field"] input').fill("NonExistent");
            const results = page.getByTestId("asset-search-results");
            await expect(results).toHaveCount(0);
        });
    });

    test.describe("Context Menu Tests", () => {
        test("Context menu remains permanently", async ({ page }) => {
            await page.locator("canvas").nth(2).click({ button: "right" });
            await page.waitForTimeout(1000);
            const contextMenu = page.getByTestId("context-menu");
            await expect(contextMenu).toBeVisible();
        });
    });
});
