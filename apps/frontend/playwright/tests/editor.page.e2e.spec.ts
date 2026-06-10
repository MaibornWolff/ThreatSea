import { test, expect } from "@playwright/test";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { getProjects, importProject, deleteProject } from "../utils/project.api.ts";
import { deleteCatalog } from "../utils/catalog.api.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import { EditorPage } from "../pages/editor.page.ts";
import threatsFixture from "../fixtures/threats.json" with { type: "json" };

type ExportedProject = typeof threatsFixture.project;
let exportedProject: ExportedProject;
let projectId: number | undefined;
let catalogId: number | undefined;
let projectName: string | undefined;

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
    projectId = undefined;
    catalogId = undefined;
    projectName = undefined;

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
    if (!project) {
        throw new Error(`Project "${projectName}" not found after import`);
    }
    projectId = project.id;
    catalogId = project.catalogId;
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
            await pg.clickCanvas(505, 345);
            await expect(pg.componentAssetSearchField).toBeVisible();
            await pg.componentAssetSearchField.fill("SAMPLE ASSET");
            await expect(pg.componentAssetSearchResults).toHaveCount(2);
            await expect(pg.componentAssetSearchResults.nth(0)).toContainText("Sample Asset 1");
            await expect(pg.componentAssetSearchResults.nth(1)).toContainText("Sample Asset 2");
        });

        test("Performs substring search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(505, 345);
            await expect(pg.componentAssetSearchField).toBeVisible();
            await pg.componentAssetSearchField.fill("Asset");
            await expect(pg.componentAssetSearchResults).toHaveCount(2);
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(505, 345);
            await expect(pg.componentAssetSearchField).toBeVisible();
            await pg.componentAssetSearchField.fill("aSSeT");
            await expect(pg.componentAssetSearchResults).toHaveCount(2);
        });

        test("Handles one search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(505, 345);
            await expect(pg.componentAssetSearchField).toBeVisible();
            await pg.componentAssetSearchField.fill("Sample Asset 1");
            await expect(pg.componentAssetSearchResults).toHaveCount(1);
            await expect(pg.componentAssetSearchResults.nth(0)).toContainText("Sample Asset 1");
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(505, 345);
            await expect(pg.componentAssetSearchField).toBeVisible();
            await pg.componentAssetSearchField.fill("NonExistent");
            await expect(pg.componentAssetSearchResults).toHaveCount(0);
        });
    });

    test.describe("Point Of Attack Sidebar Tests", () => {
        test("Performs case insensitive search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 345);
            await expect(pg.poaAssetSearchField).toBeVisible();
            await pg.poaAssetSearchField.fill("SAMPLE ASSET");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Performs substring search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 345);
            await expect(pg.poaAssetSearchField).toBeVisible();
            await pg.poaAssetSearchField.fill("Asset");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 345);
            await expect(pg.poaAssetSearchField).toBeVisible();
            await pg.poaAssetSearchField.fill("aSSeT");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Handles one search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 345);
            await expect(pg.poaAssetSearchField).toBeVisible();
            await pg.poaAssetSearchField.fill("Sample Asset 1");
            await expect(pg.assetSearchResults).toHaveCount(1);
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(822, 345);
            await expect(pg.poaAssetSearchField).toBeVisible();
            await pg.poaAssetSearchField.fill("NonExistent");
            await expect(pg.assetSearchResults).toHaveCount(0);
        });
    });

    test.describe("Communication Interface Sidebar Tests", () => {
        test("Performs case insensitive search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(880, 375);
            await expect(pg.communicationListItem).toBeVisible();
            await pg.communicationListItem.click();
            await expect(pg.communicationAssetSearchField).toBeVisible();
            await pg.communicationAssetSearchField.fill("SAMPLE ASSET");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Performs substring search", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(880, 375);
            await expect(pg.communicationListItem).toBeVisible();
            await pg.communicationListItem.click();
            await expect(pg.communicationAssetSearchField).toBeVisible();
            await pg.communicationAssetSearchField.fill("Asset");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Performs case insensitive and substring search together", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(880, 375);
            await expect(pg.communicationListItem).toBeVisible();
            await pg.communicationListItem.click();
            await expect(pg.communicationAssetSearchField).toBeVisible();
            await pg.communicationAssetSearchField.fill("aSSeT");
            await expect(pg.assetSearchResults).toHaveCount(2);
        });

        test("Handles one search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(880, 375);
            await expect(pg.communicationListItem).toBeVisible();
            await pg.communicationListItem.click();
            await expect(pg.communicationAssetSearchField).toBeVisible();
            await pg.communicationAssetSearchField.fill("Sample Asset 1");
            await expect(pg.assetSearchResults).toHaveCount(1);
        });

        test("Handles empty search result gracefully", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.addCommunication();
            await pg.clickCanvas(880, 375);
            await expect(pg.communicationListItem).toBeVisible();
            await pg.communicationListItem.click();
            await expect(pg.communicationAssetSearchField).toBeVisible();
            await pg.communicationAssetSearchField.fill("NonExistent");
            await expect(pg.assetSearchResults).toHaveCount(0);
        });
    });

    test.describe("Asset Name Click Navigation Tests", () => {
        test("Clicking asset name in component sidebar opens edit dialog", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(850, 345);
            await expect(pg.componentAssetSearchResults.first()).toBeVisible();
            await pg.componentAssetSearchResults.first().click();
            await expect(page).toHaveURL(/\/system\/assets\/\d+\/edit/);
            await expect(pg.assetCreationModalNameInput).toBeVisible();
        });

        test("Closing asset edit dialog returns to editor", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(850, 345);
            await expect(pg.componentAssetSearchResults.first()).toBeVisible();
            await pg.componentAssetSearchResults.first().click();
            await expect(page).toHaveURL(/\/system\/assets\/\d+\/edit/);
            await pg.cancelButton.click();
            await expect(page).toHaveURL(/\/system$/);
        });

        test("Clicking asset name in POA sidebar opens edit dialog", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(850, 345);
            await expect(pg.componentAssetSearchContainer).toBeVisible();
            await pg.poaSwitchButton("USER_INTERFACE").click();
            await expect(pg.poaAssetSearchContainer).toBeVisible();
            await pg.assetSearchResults.first().click();
            await expect(page).toHaveURL(/\/system\/assets\/\d+\/edit/);
        });
    });

    test.describe("POA Navigation Tests", () => {
        test("Clicking POA label switches sidebar to POA view", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(850, 345);
            await expect(pg.componentAssetSearchContainer).toBeVisible();
            await pg.poaSwitchButton("USER_INTERFACE").click();
            await expect(pg.poaAssetSearchContainer).toBeVisible();
            await expect(pg.poaBreadcrumbComponent).toBeVisible();
            await expect(pg.poaBreadcrumbComponent).toContainText("Client");
        });

        test("Clicking breadcrumb component name returns to component sidebar", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.clickCanvas(850, 345);
            await expect(pg.componentAssetSearchContainer).toBeVisible();
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
            await pg.clickCanvas(850, 345);
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

    test.describe("Custom Component Tests", () => {
        const STANDARD_ICONS = ["Users", "Client", "Server", "Database"];

        for (const icon of STANDARD_ICONS) {
            test(`Should create a custom component with the ${icon} standard icon`, async ({ page, browserName }, {
                testId,
            }) => {
                const pg = new EditorPage(page);
                const name = `Custom ${icon} ${buildTestId(browserName, testId)}`;

                await pg.openAddCustomComponentDialog();
                await pg.componentNameInput.fill(name);
                await pg.standardIconButton(icon).click();
                await expect(pg.standardIconButton(icon)).toHaveAttribute("aria-pressed", "true");
                await pg.poaSwitch("User Interface").click();
                await pg.componentDialogSaveButton.click();
                await expect(pg.componentDialog).toBeHidden();

                await pg.openContextMenu();
                await pg.expandCustomComponents();
                await expect(pg.customComponentEntry(name)).toBeVisible();
            });
        }

        test("Should create a custom component with an uploaded custom icon", async ({ page, browserName }, {
            testId,
        }) => {
            const pg = new EditorPage(page);
            const name = `Custom Upload ${buildTestId(browserName, testId)}`;

            await pg.openAddCustomComponentDialog();
            await pg.componentNameInput.fill(name);
            await pg.uploadCustomIcon();
            await pg.poaSwitch("User Interface").click();
            await pg.componentDialogSaveButton.click();
            await expect(pg.componentDialog).toBeHidden();

            await pg.openContextMenu();
            await pg.expandCustomComponents();
            await expect(pg.customComponentEntry(name)).toBeVisible();
        });

        test("Should require an icon before saving a custom component", async ({ page, browserName }, { testId }) => {
            const pg = new EditorPage(page);
            const name = `No Icon ${buildTestId(browserName, testId)}`;

            await pg.openAddCustomComponentDialog();
            await pg.componentNameInput.fill(name);
            await pg.poaSwitch("User Interface").click();
            await pg.componentDialogSaveButton.click();

            await expect(pg.iconRequiredError).toBeVisible();
            await expect(pg.componentDialog).toBeVisible();
        });

        test("Should require a point of attack before saving a custom component", async ({ page, browserName }, {
            testId,
        }) => {
            const pg = new EditorPage(page);
            const name = `No POA ${buildTestId(browserName, testId)}`;

            await pg.openAddCustomComponentDialog();
            await pg.componentNameInput.fill(name);
            await pg.standardIconButton("Users").click();
            await pg.componentDialogSaveButton.click();

            await expect(pg.poaRequiredError).toBeVisible();
            await expect(pg.componentDialog).toBeVisible();
        });

        test("Should delete a custom component via the three-dot menu", async ({ page, browserName }, { testId }) => {
            const pg = new EditorPage(page);
            const name = `Deletable ${buildTestId(browserName, testId)}`;

            await pg.openAddCustomComponentDialog();
            await pg.componentNameInput.fill(name);
            await pg.standardIconButton("Server").click();
            await pg.poaSwitch("User Interface").click();
            await pg.componentDialogSaveButton.click();
            await expect(pg.componentDialog).toBeHidden();

            await pg.openContextMenu();
            await pg.expandCustomComponents();
            await expect(pg.customComponentEntry(name)).toBeVisible();

            await pg.customComponentMenuButton(name).click();
            await pg.deleteComponentMenuItem.click();
            await pg.confirmButton.click();

            await expect(pg.customComponentEntry(name)).toHaveCount(0);
        });
    });
});
