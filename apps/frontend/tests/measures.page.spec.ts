import { test, expect } from "@playwright/test";
import {
    createCatalog,
    createMeasure,
    createMeasures,
    createProject,
    getProjects,
    getCatalogs,
    deleteCatalog,
    deleteProjects,
} from "./test-utils.ts";
import measuresFixture from "./fixtures/measures.json" with { type: "json" };
import { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";

const measures: { name: string; description: string; scheduledAt: Date; projectId: number }[] = [];
const invalidMeasures: { name: string; description: string; scheduledAt: Date }[] = [];
let projectId: number;

function toDisplayFormat(date: Date): string {
    return date.toISOString().split("T")[0]!;
}

test.beforeAll(async () => {
    measures.push(
        ...measuresFixture.measures.map((measure) => {
            return { ...measure, scheduledAt: new Date(measure.scheduledAt), projectId: -1 };
        })
    );

    invalidMeasures.push(
        ...measuresFixture.invalidMeasures.map((invalidMeasure) => {
            return { ...invalidMeasure, scheduledAt: new Date(invalidMeasure.scheduledAt) };
        })
    );
});

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
    await page.goto("/projects");
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
    const catalog = await createCatalog(request, token, {
        name: `Sample Catalog ${browserName}-${testId.slice(0, 16)}`,
        language: "EN",
        defaultContent: true,
    });

    const project = await createProject(request, token, {
        name: `Sample Project ${browserName}-${testId.slice(0, 16)}`,
        description: "Sample project description",
        confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
        catalogId: catalog.id,
    });

    projectId = project.id;
    measures.forEach((measure) => (measure.projectId = projectId));

    await page.goto(`/projects/${projectId}/measures`);
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;

    const projects = await getProjects(request, token);
    const projectIds = projects
        .filter((project) => project.name.includes(`${browserName}-${testId.slice(0, 16)}`))
        .map((project) => project.id);
    await deleteProjects(request, token, projectIds);

    const catalogs = await getCatalogs(request, token);
    const catalogId = catalogs.find((catalog) => catalog.name.includes(`${browserName}-${testId.slice(0, 16)}`))!.id;
    await deleteCatalog(request, token, catalogId);
});

test.describe("Measures Page tests", () => {
    test("Should create new measures", async ({ page, browserName }, { testId }) => {
        for (const measure of measures.slice(0, 3)) {
            await page.locator('[data-testid="measures-page_add-measure-button"]').click();

            await page
                .locator('[data-testid="measure-creation-modal_name-input"] textarea[name="name"]')
                .fill(measure.name + " " + `${browserName}-${testId.slice(0, 16)}`);
            await page
                .locator('[data-testid="measure-creation-modal_description-input"] textarea[name="description"]')
                .fill(measure.description);
            await page
                .locator('[data-testid="measure-creation-modal_scheduled-at-input"] input')
                .fill(toDisplayFormat(measure.scheduledAt));

            await page.locator('[data-testid="save-button"]').click();
        }

        await expect(page.locator('[data-testid="measures-page_measures-list-entry"]')).toHaveCount(3);
    });

    test("Should sort all measures by name", async ({ page, request }) => {
        const sortedMeasures = measures.slice().sort((a, b) => a.name.localeCompare(b.name));

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createMeasures(request, token, measures);
        await page.reload();

        await expect(page.locator('[data-testid="measures-page_sort-measures-by-name-button"]')).toHaveAttribute(
            "aria-sort",
            "ascending"
        );

        const entries = await page.locator('[data-testid="measures-page_measures-list-entry_name"]').allTextContents();
        for (let i = 0; i < sortedMeasures.length; i++) {
            expect(entries[i]).toContain(sortedMeasures[i]!.name);
        }

        await page.locator('[data-testid="measures-page_sort-measures-by-name-button"]').click();
        await expect(page.locator('[data-testid="measures-page_sort-measures-by-name-button"]')).toHaveAttribute(
            "aria-sort",
            "descending"
        );

        const reversedEntries = await page
            .locator('[data-testid="measures-page_measures-list-entry_name"]')
            .allTextContents();
        for (let i = 0; i < sortedMeasures.length; i++) {
            expect(reversedEntries[i]).toContain([...sortedMeasures].reverse()[i]!.name);
        }
    });

    test("Should sort all measures by scheduled at date", async ({ page, request }) => {
        const sortedMeasures = measures.slice().sort((a, b) => +a.scheduledAt - +b.scheduledAt);

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createMeasures(request, token, measures);
        await page.reload();

        await page.locator('[data-testid="measures-page_sort-measures-by-scheduled-at-button"]').click();
        await expect(
            page.locator('[data-testid="measures-page_sort-measures-by-scheduled-at-button"]')
        ).toHaveAttribute("aria-sort", "ascending");

        const entries = await page
            .locator('[data-testid="measures-page_measures-list-entry_scheduled-at"]')
            .allTextContents();
        for (let i = 0; i < sortedMeasures.length; i++) {
            expect(entries[i]).toContain(toDisplayFormat(sortedMeasures[i]!.scheduledAt));
        }

        await page.locator('[data-testid="measures-page_sort-measures-by-scheduled-at-button"]').click();
        await expect(
            page.locator('[data-testid="measures-page_sort-measures-by-scheduled-at-button"]')
        ).toHaveAttribute("aria-sort", "descending");

        const reversedEntries = await page
            .locator('[data-testid="measures-page_measures-list-entry_scheduled-at"]')
            .allTextContents();
        for (let i = 0; i < sortedMeasures.length; i++) {
            expect(reversedEntries[i]).toContain(toDisplayFormat([...sortedMeasures].reverse()[i]!.scheduledAt));
        }
    });

    test("Should update an existing measure", async ({ page, request }) => {
        const measure = measures[Math.floor(Math.random() * measures.length)]!;
        const updatedName = "Updated test measure name";
        const updatedScheduledAt = new Date();

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createMeasure(request, token, measure);
        await page.reload();

        await page.locator('[data-testid="measures-page_measures-list-entry"]').first().click();
        await page.locator('[data-testid="measure-creation-modal_name-input"] textarea[name="name"]').fill("");
        await page.locator('[data-testid="measure-creation-modal_name-input"] textarea[name="name"]').fill(updatedName);
        await page.locator('[data-testid="measure-creation-modal_scheduled-at-input"] input').fill("");
        await page
            .locator('[data-testid="measure-creation-modal_scheduled-at-input"] input')
            .fill(toDisplayFormat(updatedScheduledAt));
        await page.locator('[data-testid="save-button"]').click();

        await expect(page.locator('[data-testid="measures-page_measures-list-entry_name"]').first()).toContainText(
            updatedName
        );
        await expect(
            page.locator('[data-testid="measures-page_measures-list-entry_scheduled-at"]').first()
        ).toContainText(toDisplayFormat(updatedScheduledAt));
    });

    test("Should duplicate a measure", async ({ page, request }) => {
        const measure = measures[Math.floor(Math.random() * measures.length)]!;

        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createMeasure(request, token, measure);
        await page.reload();

        await page.locator('[data-testid="measures-page_measures-list-entry_copy-button"]').first().click();
        await page.locator('[data-testid="save-button"]').click();

        await expect(page.locator('[data-testid="measures-page_measures-list-entry_name"]').first()).toContainText(
            measure.name
        );
        await expect(
            page.locator('[data-testid="measures-page_measures-list-entry_scheduled-at"]').first()
        ).toContainText(toDisplayFormat(measure.scheduledAt));
    });

    test("Should delete an existing measure", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        await createMeasures(request, token, measures.slice(0, 2));
        await page.reload();

        await page.locator('[data-testid="measures-page_measures-list-entry_delete-button"]').first().click();
        await page.locator('[data-testid="confirm-button"]').click();

        await expect(page.locator('[data-testid="measures-page_measures-list-entry"]')).toHaveCount(1);
    });

    test("Should not create/update measures with invalid inputs", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        //Before the tests are made, 2 measures will be created. The first one is there to be edited in the "edit" step. The other measure is there to be compared to for the unique name test
        //measures[1] = "Another Measure"
        //measures[2] = "Duplicated Name Measure"
        const measureToEdit = measures[1]!;
        const measureDuplicate = measures[2]!;
        await createMeasure(request, token, measureToEdit);
        await createMeasure(request, token, measureDuplicate);
        await page.reload();

        const scopes = ["add", "edit"];
        for (const invalidMeasure of invalidMeasures) {
            for (const scope of scopes) {
                if (scope === "add") {
                    await page.locator('[data-testid="measures-page_add-measure-button"]').click();
                }
                if (scope === "edit") {
                    await page.locator('[data-testid="measures-page_measures-list-entry"]').first().click();
                    await page
                        .locator('[data-testid="measure-creation-modal_name-input"] textarea[name="name"]')
                        .fill("");
                    await page.locator('[data-testid="measure-creation-modal_scheduled-at-input"] input').fill("");
                }

                if (invalidMeasures.indexOf(invalidMeasure) === 0) {
                    await page.locator('[data-testid="save-button"]').click();
                    await expect(page).toHaveURL(`/projects/${projectId}/measures/edit`);
                }

                await page
                    .locator('[data-testid="measure-creation-modal_name-input"] textarea[name="name"]')
                    .fill(invalidMeasure.name);
                await page
                    .locator('[data-testid="measure-creation-modal_scheduled-at-input"] input')
                    .fill(toDisplayFormat(invalidMeasure.scheduledAt));
                await page.locator('[data-testid="save-button"]').click();

                await expect(page).toHaveURL(`/projects/${projectId}/measures/edit`);
                await page.locator('[data-testid="cancel-button"]').click();
            }
        }
    });

    test("Should test page navigation", async ({ page, request }) => {
        const token = (await page.evaluate(() => localStorage.getItem("csrfToken")))!;
        const measure = measures[Math.floor(Math.random() * measures.length)]!;
        await createMeasure(request, token, measure);
        await page.reload();

        await page.locator('[data-testid="measures-page_add-measure-button"]').click();
        await expect(page).toHaveURL(`/projects/${projectId}/measures/edit`);
        await page.locator('[data-testid="cancel-button"]').click();
        await expect(page).toHaveURL(`/projects/${projectId}/measures`);

        await page.locator('[data-testid="navigation-header_projects-page-button"]').click();
        await expect(page).toHaveURL("/projects");
        await page.goto(`/projects/${projectId}/assets`);

        await page
            .locator('[data-testid="navigation-header_catalogs-page-button"]')
            .click()
            .then(async () => await expect(page).toHaveURL("/catalogs"));

        await page.goto(`/projects/${projectId}/assets`);

        const projectInternalLinks = ["system", "assets", "threats", "measures", "risk", "report", "members"];

        for (const link of projectInternalLinks) {
            await page.locator(`[data-testid="navigation-header_${link}-button"]`).click();
            await expect(page).toHaveURL(`/projects/${projectId}/${link}`);
            await page.goto(`/projects/${projectId}/assets`);
        }

        await page.locator('[data-testid="navigation-header_account-button"]').click();
        await expect(page.locator('[data-testid="account-menu_username"]')).toBeVisible();
        await expect(page.locator('[data-testid="account-menu_logout-button"]')).toBeVisible();
    });
});
