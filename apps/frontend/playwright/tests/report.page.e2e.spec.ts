import { test, expect } from "@playwright/test";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { getProjects, importProject, deleteProject } from "../utils/project.api.ts";
import { deleteCatalog } from "../utils/catalog.api.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import { ReportPage } from "../pages/report.page.ts";
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

    const pg = new ReportPage(page);
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
    const token = await new ReportPage(page).getCsrfToken();
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

test.describe("Report Page Tests", () => {
    test("Should load the report page with settings panel visible", async ({ page }) => {
        const pg = new ReportPage(page);
        await expect(pg.pageSection("Show Cover Page")).toBeVisible();
        await expect(pg.createPdfButton).toBeVisible();
    });

    test("Should toggle a page section switch and show create PDF button", async ({ page }) => {
        const pg = new ReportPage(page);
        await pg.createPdfButton.click();
        await expect(pg.downloadPdfButton).toBeVisible({ timeout: 30000 });

        const coverSwitch = pg.pageSection("Show Cover Page");
        await coverSwitch.click();
        await expect(pg.createPdfButton).toBeVisible();
    });

    test("Should generate PDF and show download buttons", async ({ page }) => {
        const pg = new ReportPage(page);
        await pg.createPdfButton.click();
        await expect(pg.downloadPdfButton).toBeVisible({ timeout: 30000 });
        await expect(pg.openPdfButton).toBeVisible();
    });

    test("Should download PDF file", async ({ page }) => {
        const pg = new ReportPage(page);
        await pg.createPdfButton.click();
        await expect(pg.downloadPdfButton).toBeVisible({ timeout: 30000 });

        const downloadPromise = page.waitForEvent("download");
        await pg.downloadPdfButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    });

    test("Should switch report language to DE", async ({ page }) => {
        const pg = new ReportPage(page);
        const deButton = pg.languageButton("DE");
        await deButton.click();
        await expect(deButton).toHaveAttribute("aria-pressed", "true");
        await expect(pg.languageButton("EN")).toHaveAttribute("aria-pressed", "false");
    });

    test("Should switch sort to Risk (gross)", async ({ page }) => {
        const pg = new ReportPage(page);
        const grossButton = pg.sortByButton("Risk (gross)");
        await grossButton.click();
        await expect(grossButton).toHaveAttribute("aria-pressed", "true");
        await expect(pg.sortByButton("Risk (net)")).toHaveAttribute("aria-pressed", "false");
    });

    test("Should download Excel export file", async ({ page }) => {
        const pg = new ReportPage(page);
        await expect(pg.excelExportButton).toBeVisible();

        const downloadPromise = page.waitForEvent("download");
        await pg.excelExportButton.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    });

    test("Should mark report as changed when scheduled at date is set", async ({ page }) => {
        const pg = new ReportPage(page);
        await pg.createPdfButton.click();
        await expect(pg.downloadPdfButton).toBeVisible({ timeout: 30000 });

        await pg.scheduledFromInput.fill("2026-01-01");
        await expect(pg.createPdfButton).toBeVisible();
    });
});
