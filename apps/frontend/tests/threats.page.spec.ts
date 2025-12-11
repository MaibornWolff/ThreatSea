import { test, expect } from "@playwright/test";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { getProjects, importProject, deleteProject, deleteCatalog } from "./test-utils.ts";
import threatsFixture from "./fixtures/threats.json" with { type: "json" };
import type { USER_ROLES } from "#api/types/user-roles.types.ts";

let exportedProject: {
    project: Omit<ExtendedProject, "image" | "confidentialityLevel">;
};
let projectId: number;

test.beforeAll(async () => {
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
    await page.goto("/projects");
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
    await importProject(request, token, exportedProject);
    const projects = await getProjects(request, token);
    projectId = projects.find((project) => project.name === exportedProject.project.name)!.id;

    await page.goto(`/projects/${projectId}/threats`);
});

test.afterEach(async ({ page, request }) => {
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const projects = await getProjects(request, token);
    const project = projects.find((project) => project.name === exportedProject.project.name)!;
    await deleteProject(request, token, project.id);

    await deleteCatalog(request, token, project.catalogId);
});

test.describe("Threats Page Tests", () => {
    test("Should test if threats were created", async ({ page }) => {
        await expect(page.locator('[data-testid="threats-page_threats-list-entry"]')).toHaveCount(4);
    });
});
