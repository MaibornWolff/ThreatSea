import { test, expect } from "@playwright/test";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { getProjects, importProject, deleteProject } from "../utils/project.api.ts";
import { deleteCatalog } from "../utils/catalog.api.ts";
import { ThreatsPage } from "../pages/threats.page.ts";
import threatsFixture from "../fixtures/threats.json" with { type: "json" };

type ExportedProject = typeof threatsFixture.project;
let exportedProject: ExportedProject;
let projectId: number;

const safeDeleteCatalog = async (request: Parameters<typeof deleteCatalog>[0], token: string, catalogId: number) => {
    try {
        await deleteCatalog(request, token, catalogId);
    } catch {
        // Catalog might already be removed when the project is deleted.
    }
};

test.beforeAll(() => {
    exportedProject = {
        ...threatsFixture.project,
        project: {
            ...threatsFixture.project.project,
            role: threatsFixture.project.project.role as USER_ROLES,
        },
    };
});

test.beforeEach(async ({ page, request }) => {
    const pg = new ThreatsPage(page);
    await page.goto("/projects");
    const token = await pg.getCsrfToken();
    const existingProjects = await getProjects(request, token);
    const duplicates = existingProjects.filter((p) => p.name === exportedProject.project.name);
    for (const duplicate of duplicates) {
        await deleteProject(request, token, duplicate.id);
        await safeDeleteCatalog(request, token, duplicate.catalogId);
    }
    await importProject(request, token, exportedProject);
    const projects = await getProjects(request, token);
    projectId = projects.find((p) => p.name === exportedProject.project.name)!.id;
    await pg.goto(projectId);
});

test.afterEach(async ({ page, request }) => {
    const token = await new ThreatsPage(page).getCsrfToken();
    const projects = await getProjects(request, token);
    const project = projects.find((p) => p.name === exportedProject.project.name)!;
    await deleteProject(request, token, project.id);
    await safeDeleteCatalog(request, token, project.catalogId);
});

test.describe("Threats Page Tests", () => {
    test("Should test if threats were created", async ({ page }) => {
        const pg = new ThreatsPage(page);
        const expectedCount = exportedProject.threats?.length ?? 0;
        await expect(pg.threatListEntries).toHaveCount(expectedCount, { timeout: 20000 });
    });
});
