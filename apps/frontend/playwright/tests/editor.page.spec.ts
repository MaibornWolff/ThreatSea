import { test, expect } from "@playwright/test";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { getProjects, importProject, deleteProject } from "../utils/project.api.ts";
import { deleteCatalog } from "../utils/catalog.api.ts";
import { EditorPage } from "../pages/editor.page.ts";
import threatsFixture from "../../tests/fixtures/threats.json" with { type: "json" };

let exportedProject: { project: Omit<ExtendedProject, "image" | "confidentialityLevel"> };
let projectId: number;

test.beforeAll(() => {
    exportedProject = {
        ...threatsFixture.project,
        project: {
            ...threatsFixture.project.project,
            role: threatsFixture.project.project.role as USER_ROLES,
            createdAt: new Date(threatsFixture.project.project.createdAt),
            updatedAt: new Date(threatsFixture.project.project.updatedAt),
        },
    };
});

test.beforeEach(async ({ page, request }) => {
    const pg = new EditorPage(page);
    await page.goto("/projects");
    const token = await pg.getCsrfToken();
    await importProject(request, token, exportedProject);
    const projects = await getProjects(request, token);
    projectId = projects.find((p) => p.name === exportedProject.project.name)!.id;
    await pg.goto(projectId);
});

test.afterEach(async ({ page, request }) => {
    const token = await new EditorPage(page).getCsrfToken();
    const projects = await getProjects(request, token);
    const project = projects.find((p) => p.name === exportedProject.project.name)!;
    await deleteProject(request, token, project.id);
    await deleteCatalog(request, token, project.catalogId);
});

test.describe("Editor Page Tests", () => {
    test.describe("Component Sidebar Tests", () => {
        test("Performs case insensitive search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(500, 340);
            await pg.componentAssetSearchField.fill("SAMPLE ASSET");
            await expect(pg.componentAssetSearchResults).toHaveCount(2);
            await expect(pg.componentAssetSearchResults.nth(0)).toContainText("Sample Asset 1");
            await expect(pg.componentAssetSearchResults.nth(1)).toContainText("Sample Asset 2");
        });

        test("Performs substring search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(500, 340);
            await pg.componentAssetSearchField.fill("Asset");
            await expect(pg.componentAssetSearchResults).toHaveCount(2);
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(500, 340);
            await pg.componentAssetSearchField.fill("aSSeT");
            await expect(pg.componentAssetSearchResults).toHaveCount(2);
        });

        test("Handles one search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(500, 340);
            await pg.componentAssetSearchField.fill("Sample Asset 1");
            await expect(pg.componentAssetSearchResults).toHaveCount(1);
            await expect(pg.componentAssetSearchResults.nth(0)).toContainText("Sample Asset 1");
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(500, 340);
            await pg.componentAssetSearchField.fill("NonExistent");
            await expect(pg.componentAssetSearchResults).toHaveCount(0);
        });
    });

    test.describe("Point Of Attack Sidebar Tests", () => {
        test("Performs case insensitive search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 340);
            await pg.poaAssetSearchField.fill("SAMPLE ASSET");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Performs substring search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 340);
            await pg.poaAssetSearchField.fill("Asset");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 340);
            await pg.poaAssetSearchField.fill("aSSeT");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Handles one search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 340);
            await pg.poaAssetSearchField.fill("Sample Asset 1");
            await expect(pg.assetSearchResults).toHaveCount(1);
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 340);
            await pg.poaAssetSearchField.fill("NonExistent");
            await expect(pg.assetSearchResults).toHaveCount(0);
        });
    });

    test.describe("Communication Interface Sidebar Tests", () => {
        test("Performs case insensitive search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(885, 370);
            await pg.communicationListItem.click();
            await pg.communicationAssetSearchField.fill("SAMPLE ASSET");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Performs substring search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(885, 370);
            await pg.communicationListItem.click();
            await pg.communicationAssetSearchField.fill("Asset");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(885, 370);
            await pg.communicationListItem.click();
            await pg.communicationAssetSearchField.fill("aSSeT");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Handles one search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(885, 370);
            await pg.communicationListItem.click();
            await pg.communicationAssetSearchField.fill("Sample Asset 1");
            await expect(pg.assetSearchResults).toHaveCount(1);
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(885, 370);
            await pg.communicationListItem.click();
            await pg.communicationAssetSearchField.fill("NonExistent");
            await expect(pg.assetSearchResults).toHaveCount(0);
        });
    });

    test.describe("Asset Name Click Navigation Tests", () => {
        test("Clicking asset name in component sidebar opens edit dialog", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(845, 340);
            await pg.componentAssetSearchResults.first().click();
            await expect(page).toHaveURL(/\/system\/assets\/\d+\/edit/);
            await expect(pg.assetCreationModalNameInput).toBeVisible();
        });

        test("Closing asset edit dialog returns to editor", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(845, 340);
            await pg.componentAssetSearchResults.first().click();
            await expect(page).toHaveURL(/\/system\/assets\/\d+\/edit/);
            await pg.cancelButton.click();
            await expect(page).toHaveURL(/\/system$/);
        });

        test("Clicking asset name in POA sidebar opens edit dialog", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(845, 340);
            await pg.poaSwitchButton("USER_INTERFACE").click();
            await expect(pg.poaAssetSearchContainer).toBeVisible();
            await pg.assetSearchResults.first().click();
            await expect(page).toHaveURL(/\/system\/assets\/\d+\/edit/);
        });
    });

    test.describe("POA Navigation Tests", () => {
        test("Clicking POA label switches sidebar to POA view", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(845, 340);
            await pg.poaSwitchButton("USER_INTERFACE").click();
            await expect(pg.poaAssetSearchContainer).toBeVisible();
            await expect(pg.poaBreadcrumbComponent).toBeVisible();
            await expect(pg.poaBreadcrumbComponent).toContainText("Client");
        });

        test("Clicking breadcrumb component name returns to component sidebar", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(845, 340);
            await pg.poaSwitchButton("USER_INTERFACE").click();
            await expect(pg.poaAssetSearchContainer).toBeVisible();
            await pg.poaBreadcrumbComponent.click();
            await expect(pg.componentAssetSearchContainer).toBeVisible();
            await expect(pg.poaAssetSearchContainer).not.toBeVisible();
        });
    });

    test.describe("Connected Component Navigation Tests", () => {
        test("Clicking connected component name switches sidebar to that component", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(845, 340);
            await expect(pg.connectedComponentName().first()).toBeVisible();
            await pg.connectedComponentName().first().click();
            await expect(pg.connectedComponentName().first()).toContainText("Client");
        });
    });

    test.describe("Context Menu Tests", () => {
        test("Context menu remains permanently", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.rightClickCanvas();
            await page.waitForTimeout(1000);
            await expect(pg.contextMenu).toBeVisible();
        });
    });
});

