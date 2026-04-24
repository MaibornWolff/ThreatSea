import { test, expect } from "@playwright/test";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { getProjects, importProject, deleteProject } from "../utils/project.api.ts";
import { deleteCatalog } from "../utils/catalog.api.ts";
import { ThreatsPage } from "../pages/threats.page.ts";
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
    const pg = new ThreatsPage(page);
    await page.goto("/projects");
    const token = await pg.getCsrfToken();
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
    await deleteCatalog(request, token, project.catalogId);
});

test.describe("Threats Page Tests", () => {
    test("Should test if threats were created", async ({ page }) => {
        const pg = new ThreatsPage(page);
        await expect(pg.threatListEntries).toHaveCount(4);
    });
});

