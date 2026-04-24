import { test, expect } from "@playwright/test";
import { createCatalog, deleteCatalog, getCatalogs } from "../utils/catalog.api.ts";
import { createProject, deleteProjects, getProjects } from "../utils/project.api.ts";
import { createMeasure, createMeasures } from "../utils/measure.api.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import { MeasuresPage } from "../pages/measures.page.ts";
import { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";
import measuresFixture from "../fixtures/measures.json" with { type: "json" };

const measures: { name: string; description: string; scheduledAt: Date; projectId: number }[] = [];
const invalidMeasures: { name: string; description: string; scheduledAt: Date }[] = [];
let projectId: number;

function toDisplayFormat(date: Date): string {
    return date.toISOString().split("T")[0]!;
}

test.beforeAll(() => {
    measures.push(
        ...measuresFixture.measures.map((m) => ({ ...m, scheduledAt: new Date(m.scheduledAt), projectId: -1 }))
    );
    invalidMeasures.push(
        ...measuresFixture.invalidMeasures.map((m) => ({ ...m, scheduledAt: new Date(m.scheduledAt) }))
    );
});

test.beforeEach(async ({ page, request, browserName }, { testId }) => {
    const pg = new MeasuresPage(page);
    await page.goto("/projects");
    const token = await pg.getCsrfToken();
    const tid = buildTestId(browserName, testId);

    const catalog = await createCatalog(request, token, {
        name: `Sample Catalog ${tid}`,
        language: "EN",
        defaultContent: true,
    });
    const project = await createProject(request, token, {
        name: `Sample Project ${tid}`,
        description: "Sample project description",
        confidentialityLevel: CONFIDENTIALITY_LEVELS.INTERNAL,
        catalogId: catalog.id,
    });
    projectId = project.id;
    measures.forEach((m) => (m.projectId = projectId));

    await pg.goto(projectId);
});

test.afterEach(async ({ page, request, browserName }, { testId }) => {
    const token = await new MeasuresPage(page).getCsrfToken();
    const tid = buildTestId(browserName, testId);

    const allProjects = await getProjects(request, token);
    await deleteProjects(
        request,
        token,
        allProjects.filter((p) => p.name.includes(tid)).map((p) => p.id)
    );

    const allCatalogs = await getCatalogs(request, token);
    const catalog = allCatalogs.find((c) => c.name.includes(tid));
    if (catalog) await deleteCatalog(request, token, catalog.id);
});

test.describe("Measures Page tests", () => {
    test("Should create new measures", async ({ page, browserName }, { testId }) => {
        const pg = new MeasuresPage(page);
        const tid = buildTestId(browserName, testId);

        for (const measure of measures.slice(0, 3)) {
            await pg.addMeasureButton.click();
            await pg.nameInput.fill(`${measure.name} ${tid}`);
            await pg.descriptionInput.fill(measure.description);
            await pg.scheduledAtInput.fill(toDisplayFormat(measure.scheduledAt));
            await pg.saveButton.click();
        }
        await expect(pg.measureListEntries).toHaveCount(3);
    });

    test("Should sort all measures by name", async ({ page, request }) => {
        const pg = new MeasuresPage(page);
        const token = await pg.getCsrfToken();
        const sorted = [...measures].sort((a, b) => a.name.localeCompare(b.name));
        await createMeasures(request, token, measures);
        await page.reload();

        await expect(pg.sortByNameButton).toHaveAttribute("aria-sort", "ascending");
        const entries = await pg.measureListEntryNames.allTextContents();
        for (let i = 0; i < sorted.length; i++) expect(entries[i]).toContain(sorted[i]!.name);

        await pg.sortByNameButton.click();
        await expect(pg.sortByNameButton).toHaveAttribute("aria-sort", "descending");
        const reversed = await pg.measureListEntryNames.allTextContents();
        for (let i = 0; i < sorted.length; i++) expect(reversed[i]).toContain([...sorted].reverse()[i]!.name);
    });

    test("Should sort all measures by scheduled at date", async ({ page, request }) => {
        const pg = new MeasuresPage(page);
        const token = await pg.getCsrfToken();
        const sorted = [...measures].sort((a, b) => +a.scheduledAt - +b.scheduledAt);
        await createMeasures(request, token, measures);
        await page.reload();

        await pg.sortByScheduledAtButton.click();
        await expect(pg.sortByScheduledAtButton).toHaveAttribute("aria-sort", "ascending");
        const entries = await pg.measureListEntryScheduledAt.allTextContents();
        for (let i = 0; i < sorted.length; i++) expect(entries[i]).toContain(toDisplayFormat(sorted[i]!.scheduledAt));

        await pg.sortByScheduledAtButton.click();
        await expect(pg.sortByScheduledAtButton).toHaveAttribute("aria-sort", "descending");
        const reversed = await pg.measureListEntryScheduledAt.allTextContents();
        for (let i = 0; i < sorted.length; i++)
            expect(reversed[i]).toContain(toDisplayFormat([...sorted].reverse()[i]!.scheduledAt));
    });

    test("Should update an existing measure", async ({ page, request }) => {
        const pg = new MeasuresPage(page);
        const token = await pg.getCsrfToken();
        const measure = measures[Math.floor(Math.random() * measures.length)]!;
        const updatedName = "Updated test measure name";
        const updatedDate = new Date();

        await createMeasure(request, token, measure);
        await page.reload();

        await pg.measureListEntries.first().click();
        await pg.nameInput.fill("");
        await pg.nameInput.fill(updatedName);
        await pg.scheduledAtInput.fill("");
        await pg.scheduledAtInput.fill(toDisplayFormat(updatedDate));
        await pg.saveButton.click();

        await expect(pg.measureListEntryNames.first()).toContainText(updatedName);
        await expect(pg.measureListEntryScheduledAt.first()).toContainText(toDisplayFormat(updatedDate));
    });

    test("Should duplicate a measure", async ({ page, request }) => {
        const pg = new MeasuresPage(page);
        const token = await pg.getCsrfToken();
        const measure = measures[Math.floor(Math.random() * measures.length)]!;

        await createMeasure(request, token, measure);
        await page.reload();

        await pg.measureCopyButtons.first().click();
        await pg.saveButton.click();

        await expect(pg.measureListEntryNames.first()).toContainText(measure.name);
        await expect(pg.measureListEntryScheduledAt.first()).toContainText(toDisplayFormat(measure.scheduledAt));
    });

    test("Should delete an existing measure", async ({ page, request }) => {
        const pg = new MeasuresPage(page);
        const token = await pg.getCsrfToken();
        await createMeasures(request, token, measures.slice(0, 2));
        await page.reload();

        await pg.measureDeleteButtons.first().click();
        await pg.confirmButton.click();
        await expect(pg.measureListEntries).toHaveCount(1);
    });

    test("Should not create/update measures with invalid inputs", async ({ page, request }) => {
        const pg = new MeasuresPage(page);
        const token = await pg.getCsrfToken();
        await createMeasure(request, token, measures[1]!);
        await createMeasure(request, token, measures[2]!);
        await page.reload();

        for (const invalidMeasure of invalidMeasures) {
            for (const scope of ["add", "edit"]) {
                if (scope === "add") {
                    await pg.addMeasureButton.click();
                } else {
                    await pg.measureListEntries.first().click();
                    await pg.nameInput.fill("");
                    await pg.scheduledAtInput.fill("");
                }

                if (invalidMeasures.indexOf(invalidMeasure) === 0) {
                    await pg.saveButton.click();
                    await expect(page).toHaveURL(`/projects/${projectId}/measures/edit`);
                }

                await pg.nameInput.fill(invalidMeasure.name);
                await pg.scheduledAtInput.fill(toDisplayFormat(invalidMeasure.scheduledAt));
                await pg.saveButton.click();
                await expect(page).toHaveURL(`/projects/${projectId}/measures/edit`);
                await pg.cancelButton.click();
            }
        }
    });

    test("Should test page navigation", async ({ page, request }) => {
        const pg = new MeasuresPage(page);
        const token = await pg.getCsrfToken();
        await createMeasure(request, token, measures[0]!);
        await page.reload();

        await pg.addMeasureButton.click();
        await expect(page).toHaveURL(`/projects/${projectId}/measures/edit`);
        await pg.cancelButton.click();
        await expect(page).toHaveURL(`/projects/${projectId}/measures`);

        await pg.projectsNavButton.click();
        await expect(page).toHaveURL("/projects");
        await page.goto(`/projects/${projectId}/assets`);

        await pg.catalogsNavButton.click();
        await expect(page).toHaveURL("/catalogs");
        await page.goto(`/projects/${projectId}/assets`);

        for (const link of ["system", "assets", "threats", "measures", "risk", "report", "members"]) {
            await pg.projectNavButton(link).click();
            await expect(page).toHaveURL(`/projects/${projectId}/${link}`);
            await page.goto(`/projects/${projectId}/assets`);
        }

        await pg.accountButton.click();
        await expect(pg.accountMenuUsername).toBeVisible();
        await expect(pg.accountMenuLogout).toBeVisible();
    });
});
