import { test, expect } from "@playwright/test";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { getProjects, importProject, deleteProject } from "../utils/project.api.ts";
import { deleteCatalog } from "../utils/catalog.api.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import { EditorPage } from "../pages/editor.page.ts";
import threatsFixture from "../fixtures/threats.json" with { type: "json" };

type ExportedProject = typeof threatsFixture.project;
let exportedProject: ExportedProject;
let projectId: number;
let catalogId: number;
let projectName: string;

test.beforeAll(() => {
    exportedProject = {
        ...threatsFixture.project,
        project: {
            ...threatsFixture.project.project,
            role: threatsFixture.project.project.role as USER_ROLES,
        },
    };
});

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
    const pg = new EditorPage(page);
    await page.goto("/projects");
    const token = await pg.getCsrfToken();
    const tid = buildTestId(browserName, testId);
    const projectData = structuredClone(exportedProject);
    projectName = `${exportedProject.project.name} ${tid}`;
    projectData.project.name = projectName;
    projectData.catalog.name = `${exportedProject.catalog.name} ${tid}`;
    await importProject(request, token, projectData);
    const projects = await getProjects(request, token);
    const project = projects.find((p) => p.name === projectName);
    expect(project).toBeTruthy();
    projectId = project!.id;
    catalogId = project!.catalogId;
    await pg.goto(projectId);
});

test.afterEach(async ({ page, request }) => {
    const token = await new EditorPage(page).getCsrfToken();
    const projects = await getProjects(request, token);
    const project = projects.find((p) => p.id === projectId || p.name === projectName);
    if (project) {
        await deleteProject(request, token, project.id);
    }
    const remaining = await getProjects(request, token);
    const stillUsed = remaining.some((p) => p.catalogId === catalogId);
    if (catalogId && !stillUsed) {
        await deleteCatalog(request, token, catalogId);
    }
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
