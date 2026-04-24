import { test, expect } from "@playwright/test";
import type { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";
import { createCatalog, deleteCatalog, getCatalogs } from "../utils/catalog.api.ts";
import { createProject, createProjects, deleteProjects, getProjects } from "../utils/project.api.ts";
import { buildTestId, buildProject } from "../builder/test-data.builder.ts";
import { ProjectsPage } from "../pages/projects.page.ts";
import projectsFixture from "../fixtures/projects.json" with { type: "json" };

const projects: {
    name: string;
    description: string;
    createdAt: Date;
    confidentialityLevel: CONFIDENTIALITY_LEVELS;
    catalogId: number;
}[] = [];

const invalidProjects: {
    name: string;
    description: string;
    createdAt: Date;
    confidentialityLevel: CONFIDENTIALITY_LEVELS;
}[] = [];

test.beforeAll(() => {
    projects.push(
        ...projectsFixture.projects.map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            confidentialityLevel: p.confidentialityLevel as CONFIDENTIALITY_LEVELS,
            catalogId: -1,
        }))
    );
    invalidProjects.push(
        ...projectsFixture.invalidProjects.map((p) => ({
            ...p,
            createdAt: new Date(p.createdAt),
            confidentialityLevel: p.confidentialityLevel as CONFIDENTIALITY_LEVELS,
        }))
    );
});

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
    const projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
    const token = await projectsPage.getCsrfToken();

    const catalog = await createCatalog(request, token, {
        name: `Sample-Catalog-${buildTestId(browserName, testId)}`,
        language: "EN",
        defaultContent: true,
    });
    projects.forEach((p) => (p.catalogId = catalog.id));

    await projectsPage.goto();
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = await new ProjectsPage(page).getCsrfToken();
    const tid = buildTestId(browserName, testId);

    const allProjects = await getProjects(request, token);
    const projectIds = allProjects.filter((p) => p.name.includes(tid)).map((p) => p.id);
    await deleteProjects(request, token, projectIds);

    const catalogs = await getCatalogs(request, token);
    const catalog = catalogs.find((c) => c.name.includes(tid));
    if (catalog) await deleteCatalog(request, token, catalog.id);
});

test.describe("Projects Page Tests", () => {
    test("Should create new projects", async ({ page, browserName }, { testId }) => {
        const projectsPage = new ProjectsPage(page);
        const tid = buildTestId(browserName, testId);

        for (const project of projects.slice(0, 3)) {
            await projectsPage.addProjectButton.click();
            await projectsPage.nameInput.fill(`${project.name}-${tid}`);
            await projectsPage.descriptionInput.fill(project.description);
            await projectsPage.catalogSelection.click();
            await page.locator("role=option").filter({ hasText: tid }).first().click();
            await projectsPage.saveButton.click();
        }

        await expect(projectsPage.projectCardNameFilter(tid)).toHaveCount(3);
    });

    test("Should sort all projects by date", async ({ page, request, browserName }, { testId }) => {
        const projectsPage = new ProjectsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await projectsPage.getCsrfToken();

        const renamedProjects = projects.map((p) => ({
            ...p,
            name: p.name.includes(tid) ? p.name : `${p.name}-${tid}`,
        }));
        await createProjects(request, token, renamedProjects);
        await page.reload();

        await projectsPage.sortByDateButton.click();
        await expect(projectsPage.sortByDateButton).toHaveAttribute("aria-pressed", "true");

        await projectsPage.ascendingSortButton.click();
        await expect(projectsPage.ascendingSortButton).toHaveAttribute("aria-pressed", "true");

        await projectsPage.searchField.fill(tid);
        const sorted = [...renamedProjects].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const reordered = reorderProjectsGrid(sorted);
        for (let i = 0; i < reordered.length; i++) {
            await expect(projectsPage.projectCardNames.nth(i)).toContainText(reordered[i]!.name);
        }

        await projectsPage.descendingSortButton.click();
        await expect(projectsPage.descendingSortButton).toHaveAttribute("aria-pressed", "true");
        const reorderedDesc = reorderProjectsGrid([...sorted].reverse());
        for (let i = 0; i < reorderedDesc.length; i++) {
            await expect(projectsPage.projectCardNames.nth(i)).toContainText(reorderedDesc[i]!.name);
        }
    });

    test("Should sort all projects by name", async ({ page, request, browserName }, { testId }) => {
        const projectsPage = new ProjectsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await projectsPage.getCsrfToken();

        const renamedProjects = projects.map((p) => ({
            ...p,
            name: p.name.includes(tid) ? p.name : `${p.name}-${tid}`,
        }));
        await createProjects(request, token, renamedProjects);
        await page.reload();

        await projectsPage.sortByNameButton.click();
        await expect(projectsPage.sortByNameButton).toHaveAttribute("aria-pressed", "true");

        await projectsPage.ascendingSortButton.click();
        await expect(projectsPage.ascendingSortButton).toHaveAttribute("aria-pressed", "true");

        await projectsPage.searchField.fill(tid);
        const sorted = [...renamedProjects].sort((a, b) => a.name.localeCompare(b.name));
        const reordered = reorderProjectsGrid(sorted);
        for (let i = 0; i < reordered.length; i++) {
            await expect(projectsPage.projectCardNames.nth(i)).toContainText(reordered[i]!.name);
        }

        await projectsPage.descendingSortButton.click();
        await expect(projectsPage.descendingSortButton).toHaveAttribute("aria-pressed", "true");
        const reorderedDesc = reorderProjectsGrid([...sorted].reverse());
        for (let i = 0; i < reorderedDesc.length; i++) {
            await expect(projectsPage.projectCardNames.nth(i)).toContainText(reorderedDesc[i]!.name);
        }
    });

    test("Should update an existing project", async ({ page, request, browserName }, { testId }) => {
        const projectsPage = new ProjectsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await projectsPage.getCsrfToken();

        const project = { ...projects[0]!, name: `${projects[0]!.name}-${tid}` };
        await createProject(
            request,
            token,
            buildProject(project.name, project.catalogId, project.confidentialityLevel)
        );
        await page.reload();

        await projectsPage.searchField.fill(tid);
        await projectsPage.actionMenuButton.first().click();
        await projectsPage.editProjectButton.click();

        const updatedName = `Updated test project name ${tid}`;
        await projectsPage.nameInput.fill("");
        await projectsPage.nameInput.fill(updatedName);
        await projectsPage.saveButton.click();

        await expect(projectsPage.projectCardNames.first()).toContainText(updatedName);
    });

    test("Should delete an existing project", async ({ page, request, browserName }, { testId }) => {
        const projectsPage = new ProjectsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await projectsPage.getCsrfToken();

        const toCreate = projects.slice(0, 2).map((p) => ({ ...p, name: `${p.name} ${tid}` }));
        await createProjects(request, token, toCreate);
        await page.reload();

        await projectsPage.searchField.fill(tid);
        await projectsPage.actionMenuButton.first().click();
        await projectsPage.deleteProjectButton.click();
        await projectsPage.confirmButton.click();

        await expect(projectsPage.projectCards).toHaveCount(1);
    });

    test("Should test page navigation", async ({ page, request, browserName }, { testId }) => {
        const projectsPage = new ProjectsPage(page);
        const tid = buildTestId(browserName, testId);
        const token = await projectsPage.getCsrfToken();

        const project = { ...projects[0]!, name: `${projects[0]!.name}-${tid}` };
        const created = await createProject(
            request,
            token,
            buildProject(project.name, project.catalogId, project.confidentialityLevel)
        );
        await page.reload();

        await projectsPage.addProjectButton.click();
        await expect(page).toHaveURL("/projects/add");
        await projectsPage.cancelButton.click();
        await expect(page).toHaveURL("/projects");

        await projectsPage.actionMenuButton.first().click();
        await expect(projectsPage.editProjectButton).toBeVisible();
        await expect(projectsPage.exportProjectButton).toBeVisible();
        await expect(projectsPage.deleteProjectButton).toBeVisible();
        await page.keyboard.press("Escape");

        const links = ["system", "assets", "threats", "measures", "risk", "report", "members"];
        for (const link of links) {
            await projectsPage.searchField.fill(tid);
            await projectsPage.projectCardLinkButton(link).first().click();
            await expect(page).toHaveURL(`/projects/${created.id}/${link}`);
            await projectsPage.goto();
        }

        await projectsPage.projectsNavButton.click();
        await expect(page).toHaveURL("/projects");

        await projectsPage.catalogsNavButton.click();
        await expect(page).toHaveURL("/catalogs");
        await projectsPage.goto();

        await projectsPage.accountButton.click();
        await expect(projectsPage.accountMenuUsername).toBeVisible();
        await expect(projectsPage.accountMenuLogout).toBeVisible();
    });
});

/**
 * The projects page renders in a 3-column grid. This helper reorders a sorted array
 * to match the visual order (column-by-column → row-by-row).
 */
function reorderProjectsGrid<T>(items: T[]): T[] {
    const result: T[] = [];
    const columnHeight = Math.ceil(items.length / 3);
    for (let i = 0; i < items.length; i++) {
        let newIndex = (i % 3) * columnHeight + Math.floor(i / 3);
        if (items.length % 3 === 1 && i % 3 === 2) newIndex--;
        result[newIndex] = items[i]!;
    }
    return result;
}
