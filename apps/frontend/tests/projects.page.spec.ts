import { test, expect } from "@playwright/test";
import type { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";
import {
    createCatalog,
    createProject,
    createProjects,
    getProjects,
    deleteProjects,
    getCatalogs,
    deleteCatalog,
    browserNameTestId,
} from "./test-utils.ts";
import projectsFixture from "./fixtures/projects.json" with { type: "json" };

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

test.beforeAll(async () => {
    projects.push(
        ...projectsFixture.projects.map((project) => {
            return {
                ...project,
                createdAt: new Date(project.createdAt),
                confidentialityLevel: project.confidentialityLevel as CONFIDENTIALITY_LEVELS,
                catalogId: -1,
            };
        })
    );

    invalidProjects.push(
        ...projectsFixture.invalidProjects.map((invalidProject) => {
            return {
                ...invalidProject,
                createdAt: new Date(invalidProject.createdAt),
                confidentialityLevel: invalidProject.confidentialityLevel as CONFIDENTIALITY_LEVELS,
            };
        })
    );
});

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
    await page.goto("/projects");
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const catalog = await createCatalog(request, token, {
        name: `Sample-Catalog-${browserNameTestId(browserName, testId)}`,
        language: "EN",
        defaultContent: true,
    });
    projects.forEach((project) => (project.catalogId = catalog.id));

    await page.goto("/projects");
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const projects = await getProjects(request, token);
    const projectIds = projects
        .filter((project) => project.name.includes(browserNameTestId(browserName, testId)))
        .map((project) => project.id);
    await deleteProjects(request, token, projectIds);

    const catalogs = await getCatalogs(request, token);
    const catalogId = catalogs.find((catalog) => catalog.name.includes(browserNameTestId(browserName, testId)))!.id;
    await deleteCatalog(request, token, catalogId);
});

test.describe("Projects Page Tests", () => {
    test("Should create new projects", async ({ page, browserName }, { testId }) => {
        for (const project of projects.slice(0, 3)) {
            await page.locator('[data-testid="projects-page_add-project-button"]').click();
            await page
                .locator('[data-testid="project-creation-modal_name-input"] input')
                .fill(`${project.name}-${browserNameTestId(browserName, testId)}`);
            await page
                .locator('[data-testid="project-creation-modal_description-input"] textarea[name="description"]')
                .fill(project.description);
            await page.locator('[data-testid="project-creation-modal_catalog-selection"]').click();

            const options = await page.locator("role=option");

            await options.filter({ hasText: browserNameTestId(browserName, testId) }).click();
            await page.locator('[data-testid="save-button"]').click();
        }

        const entries = await page
            .locator('[data-testid="projects-page_project-card"] p')
            .filter({ hasText: browserNameTestId(browserName, testId) });
        await expect(entries).toHaveCount(3);
    });

    test("Should sort all projects by date", async ({ page, request, browserName }, { testId }) => {
        const renamedProjects = projects.map((project) => {
            if (!project.name.includes(browserNameTestId(browserName, testId))) {
                project.name = `${project.name}-${browserNameTestId(browserName, testId)}`;
            }
            return project;
        });
        const sortedProjects = [...renamedProjects].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const reorderedSortedProjects = reorderProjects(sortedProjects);
        const reorderedReversedSortedProjects = reorderProjects([...sortedProjects].reverse());

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createProjects(request, token, renamedProjects);
        await page.reload();

        await page.locator('[data-testid="projects-page_sort-projects-by-date-button"]').click();
        await expect(page.locator('[data-testid="projects-page_sort-projects-by-date-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        await page.locator('[data-testid="projects-page_ascending-projects-sort-button"]').click();
        await expect(page.locator('[data-testid="projects-page_ascending-projects-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );
        await page
            .locator('[data-testid="projects-page_search-field"] input')
            .fill(browserNameTestId(browserName, testId));

        const entries = page.locator('[data-testid="projects-page_project-card_project-name"]');
        for (let i = 0; i < reorderedSortedProjects.length; i++) {
            await expect(entries.nth(i)).toContainText(reorderedSortedProjects[i]!.name);
        }

        await page.locator('[data-testid="projects-page_descending-projects-sort-button"]').click();
        await expect(page.locator('[data-testid="projects-page_descending-projects-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        for (let i = 0; i < reorderedReversedSortedProjects.length; i++) {
            await expect(entries.nth(i)).toContainText(reorderedReversedSortedProjects[i]!.name);
        }
    });

    test("Should sort all projects by name", async ({ page, request, browserName }, { testId }) => {
        const renamedProjects = projects.map((project) => {
            if (!project.name.includes(browserNameTestId(browserName, testId))) {
                project.name = `${project.name}-${browserNameTestId(browserName, testId)}`;
            }
            return project;
        });
        const sortedProjects = [...renamedProjects].sort((a, b) => a.name.localeCompare(b.name));
        const reorderedSortedProjects = reorderProjects(sortedProjects);
        const reorderedReversedSortedProjects = reorderProjects([...sortedProjects].reverse());

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createProjects(request, token, renamedProjects);
        await page.reload();

        await page.locator('[data-testid="projects-page_sort-projects-by-name-button"]').click();
        await expect(page.locator('[data-testid="projects-page_sort-projects-by-name-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        await page.locator('[data-testid="projects-page_ascending-projects-sort-button"]').click();
        await expect(page.locator('[data-testid="projects-page_ascending-projects-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );
        await page
            .locator('[data-testid="projects-page_search-field"] input')
            .fill(browserNameTestId(browserName, testId));

        const entries = page.locator('[data-testid="projects-page_project-card_project-name"]');
        for (let i = 0; i < reorderedSortedProjects.length; i++) {
            await expect(entries.nth(i)).toContainText(reorderedSortedProjects[i]!.name);
        }

        await page.locator('[data-testid="projects-page_descending-projects-sort-button"]').click();
        await expect(page.locator('[data-testid="projects-page_descending-projects-sort-button"]')).toHaveAttribute(
            "aria-pressed",
            "true"
        );

        for (let i = 0; i < reorderedReversedSortedProjects.length; i++) {
            await expect(entries.nth(i)).toContainText(reorderedReversedSortedProjects[i]!.name);
        }
    });

    test("Should update an existing project", async ({ page, request, browserName }, { testId }) => {
        const project = projects[Math.floor(Math.random() * projects.length)]!;
        if (!project.name.includes(browserNameTestId(browserName, testId))) {
            project.name = `${project.name}-${browserNameTestId(browserName, testId)}`;
        }
        const updatedName = `Updated test project name ${browserNameTestId(browserName, testId)}`;
        const updatedDescription = "Updated test project description";

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createProject(request, token, project);
        await page.reload();

        await page
            .locator('[data-testid="projects-page_search-field"] input')
            .fill(browserNameTestId(browserName, testId));

        await page.locator('[data-testid="projects-page_project-card_action-menu-button"]').first().click();
        await page.locator('[data-testid="projects-page_project-card_action-menu_edit-project-button"]').click();

        await page.locator('[data-testid="project-creation-modal_name-input"] input').fill("");
        await page.locator('[data-testid="project-creation-modal_name-input"] input').fill(updatedName);

        await page
            .locator('[data-testid="project-creation-modal_description-input"] textarea[name="description"]')
            .fill("");
        await page
            .locator('[data-testid="project-creation-modal_description-input"] textarea[name="description"]')
            .fill(updatedDescription);

        await page.locator('[data-testid="save-button"]').click();

        await expect(page.locator('[data-testid="projects-page_project-card_project-name"]').first()).toContainText(
            updatedName
        );

        await page.locator('[data-testid="projects-page_project-card_description-expander"]').first().click();
        await expect(
            page.locator('[data-testid="projects-page_project-card_project-description"]').first()
        ).toContainText(updatedDescription);
    });

    test("Should delete an existing project", async ({ page, request, browserName }, { testId }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const testProjects = projects.slice(0, 2);
        testProjects.forEach((catalog) => (catalog.name = `${catalog.name} ${browserNameTestId(browserName, testId)}`));
        await createProjects(request, token, testProjects);
        await page.reload();

        await page
            .locator('[data-testid="projects-page_search-field"] input')
            .fill(browserNameTestId(browserName, testId));

        await page.locator('[data-testid="projects-page_project-card_action-menu-button"]').first().click();
        await page.locator('[data-testid="projects-page_project-card_action-menu_delete-project-button"]').click();
        await page.locator('[data-testid="confirm-button"]').click();

        await expect(page.locator('[data-testid="projects-page_project-card"]')).toHaveCount(1);
    });

    test("Should not create/update projects with invalid inputs", async ({ page, request, browserName }, {
        testId,
    }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const project = projects[Math.floor(Math.random() * projects.length)]!;
        if (!project.name.includes(browserNameTestId(browserName, testId))) {
            project.name = `${project.name}-${browserNameTestId(browserName, testId)}`;
        }
        const fetchedProject = (await createProject(request, token, project)).id;
        await page.reload();

        const scopes = ["add", "edit"];
        for (const invalidProject of invalidProjects) {
            for (const scope of scopes) {
                if (scope === "add") {
                    await page.locator('[data-testid="projects-page_add-project-button"]').click();
                } else if (scope === "edit") {
                    await page
                        .locator('[data-testid="projects-page_search-field"] input')
                        .fill(browserNameTestId(browserName, testId), {
                            timeout: 30000,
                        })
                        .then(async () => {
                            await page
                                .locator('[data-testid="projects-page_project-card_action-menu-button"]')
                                .first()
                                .click();
                            await page
                                .locator('[data-testid="projects-page_project-card_action-menu_edit-project-button"]')
                                .click();

                            await page.locator('[data-testid="project-creation-modal_name-input"] input').fill("");
                            await page
                                .locator(
                                    '[data-testid="project-creation-modal_description-input"] textarea[name="description"]'
                                )
                                .fill("");
                        });
                }

                if (invalidProjects.indexOf(invalidProject) === 0) {
                    await page.locator('[data-testid="save-button"]').click();
                    await expect(page).toHaveURL(`/projects/${scope === "add" ? scope : fetchedProject}`);
                }

                await page.locator('[data-testid="project-creation-modal_name-input"] input').fill(invalidProject.name);
                await page.locator('[data-testid="save-button"]').click();
                await expect(page).toHaveURL(`/projects/${scope === "add" ? scope : fetchedProject}`);

                if (scope === "add") {
                    await page.locator('[data-testid="project-creation-modal_catalog-selection"]').click();
                    const options = await page.locator("role=option");
                    await options
                        .filter({
                            hasText: browserNameTestId(browserName, testId),
                        })
                        .click();
                    await page.locator('[data-testid="save-button"]').click();
                }

                await expect(page).toHaveURL(`/projects/${scope === "add" ? scope : fetchedProject}`);
                await page.locator('[data-testid="cancel-button"]').click();
            }
        }
    });

    test("Should test page navigation", async ({ page, request, browserName }, { testId }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const project = projects[Math.floor(Math.random() * projects.length)]!;
        if (!project.name.includes(browserNameTestId(browserName, testId))) {
            project.name = `${project.name}-${browserNameTestId(browserName, testId)}`;
        }
        const fetchedProject = (await createProject(request, token, project)).id;
        await page.reload();

        await page.locator('[data-testid="projects-page_add-project-button"]').click();
        await expect(page).toHaveURL("/projects/add");
        await page.locator('[data-testid="cancel-button"]').click();
        await expect(page).toHaveURL("/projects");

        await page.locator('[data-testid="projects-page_project-card_action-menu-button"]').first().click();
        await expect(
            page.locator('[data-testid="projects-page_project-card_action-menu_edit-project-button"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="projects-page_project-card_action-menu_export-project-button"]')
        ).toBeVisible();
        await expect(
            page.locator('[data-testid="projects-page_project-card_action-menu_delete-project-button"]')
        ).toBeVisible();
        await page.keyboard.press("Escape");

        const projectCardLinks = ["system", "assets", "threats", "measures", "risk", "report", "members"];

        for (const link of projectCardLinks) {
            await page
                .locator('[data-testid="projects-page_search-field"] input')
                .fill(browserNameTestId(browserName, testId));
            await page.locator(`[data-testid="projects-page_project-card_${link}-button"]`).first().click();
            await expect(page).toHaveURL(`/projects/${fetchedProject}/${link}`);
            await page.goto("/projects");
        }

        await page.locator('[data-testid="navigation-header_projects-page-button"]').click();
        await expect(page).toHaveURL("/projects");

        await page.locator('[data-testid="navigation-header_catalogs-page-button"]').click();
        await expect(page).toHaveURL("/catalogs");
        await page.goto("/projects");

        await page.locator('[data-testid="navigation-header_account-button"]').click();
        await expect(page.locator('[data-testid="account-menu_username"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-menu_logout-button"]')).toBeVisible();
    });
});

const reorderProjects = (
    projects: {
        name: string;
        description: string;
        createdAt: Date;
        confidentialityLevel: CONFIDENTIALITY_LEVELS;
        catalogId: number;
    }[]
) => {
    const reorderedProjects = [];
    const columnHeight = Math.ceil(projects.length / 3);
    let newIndex;

    for (let i = 0; i < projects.length; i++) {
        newIndex = (i % 3) * columnHeight + Math.floor(i / 3);
        if (projects.length % 3 === 1 && i % 3 === 2) {
            newIndex--;
        }
        reorderedProjects[newIndex] = projects[i];
    }

    return reorderedProjects;
};
