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

// Draw in the empty area between the components (Konva x ≈ 490–650, y ≈ 420–520)
// so annotations don't overlap any component, label or connection.

test.describe("Editor Drawing Tests", () => {
    test.describe("Toolbar Button Tests", () => {
        test("re-centers the editor with the center button", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.waitForEditorReady();

            const fitted = await pg.getStageScale();
            await pg.zoomIn();
            expect(await pg.getStageScale()).toBeGreaterThan(fitted);

            await pg.centerEditorButton.click();
            await expect.poll(() => pg.getStageScale()).toBeCloseTo(fitted, 3);
        });

        test("exports the system view as a PNG image", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.waitForEditorReady();

            const downloadPromise = page.waitForEvent("download");
            await pg.exportSystemImageButton.click();
            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe("systemView.png");
        });

        test("opens the shapes sub-toolbar and activates a shape", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.waitForEditorReady();

            await pg.shapesButton.click();
            for (const name of ["Rectangle", "Circle", "Line", "Arrow"]) {
                await expect(pg.shapeToolButton(name)).toBeVisible();
            }

            await pg.shapeToolButton("Rectangle").click();
            await expect(pg.shapesButton).toHaveAttribute("aria-pressed", "true");
            await expect(pg.shapeToolButton("Rectangle")).toHaveCount(0);
        });

        // Pencil/text button behaviour (incl. toggling off) is covered by the freehand and text tests below.
    });

    test.describe("Shape Drawing Tests", () => {
        interface BoxShape {
            tool: string;
            className: string;
            from: [number, number];
            to: [number, number];
            selectAt: [number, number];
        }
        const BOX_SHAPES: BoxShape[] = [
            { tool: "Rectangle", className: "Rect", from: [490, 430], to: [650, 510], selectAt: [570, 430] },
            // Click a 45° ring point — the stroke-only circle has no fill and the top tangent is too thin to hit reliably.
            { tool: "Circle", className: "Circle", from: [490, 420], to: [620, 550], selectAt: [601, 439] },
            { tool: "Line", className: "Line", from: [490, 440], to: [650, 510], selectAt: [570, 475] },
            { tool: "Arrow", className: "Arrow", from: [490, 440], to: [650, 510], selectAt: [570, 475] },
        ];

        for (const shape of BOX_SHAPES) {
            test(`draws a ${shape.tool} and deletes it`, async ({ page }) => {
                const pg = new EditorPage(page);
                await pg.waitForEditorReady();

                const before = await pg.countKonvaShapes(shape.className);

                await pg.selectShapeTool(shape.tool);
                await expect(pg.shapesButton).toHaveAttribute("aria-pressed", "true");

                await pg.drawBox(...shape.from, ...shape.to);
                await expect.poll(() => pg.countKonvaShapes(shape.className)).toBe(before + 1);

                await pg.clickCanvas(...shape.selectAt);
                await expect(pg.deleteAnnotationButton).toBeVisible();
                await pg.deleteAnnotationButton.click();

                await expect.poll(() => pg.countKonvaShapes(shape.className)).toBe(before);
            });
        }

        test("draws a freehand stroke with the pencil and deletes it", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.waitForEditorReady();

            const before = await pg.countKonvaShapes("Line");

            await pg.pencilButton.click();
            await expect(pg.pencilButton).toHaveAttribute("aria-pressed", "true");

            await pg.drawFreehand([
                [490, 440],
                [540, 460],
                [590, 440],
                [640, 470],
            ]);
            await expect.poll(() => pg.countKonvaShapes("Line")).toBe(before + 1);

            // The pencil stays active after drawing — switch it off before selecting.
            await pg.pencilButton.click();
            await expect(pg.pencilButton).toHaveAttribute("aria-pressed", "false");

            await pg.clickCanvas(540, 460);
            await expect(pg.deleteAnnotationButton).toBeVisible();
            await pg.deleteAnnotationButton.click();

            await expect.poll(() => pg.countKonvaShapes("Line")).toBe(before);
        });

        test("changes a shape's colour from the sidebar", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.waitForEditorReady();

            await pg.selectShapeTool("Rectangle");
            await pg.drawBox(490, 430, 650, 510);
            await pg.clickCanvas(570, 430);
            await expect(pg.deleteAnnotationButton).toBeVisible();

            const redChip = pg.colorPresetChip("#e74c3c");
            await expect(redChip).toHaveAttribute("aria-pressed", "false");
            await redChip.click();
            await expect(redChip).toHaveAttribute("aria-pressed", "true");
        });
    });

    test.describe("Text Annotation Tests", () => {
        test("adds a text box, types into it, and deletes it", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.waitForEditorReady();

            const before = await pg.countKonvaShapes("Text");

            await pg.textToolButton.click();
            await expect(pg.textToolButton).toHaveAttribute("aria-pressed", "true");

            await pg.drawBox(490, 440, 640, 490);
            // Text auto-enters edit mode: the inline editor receives focus.
            await expect(pg.annotationTextarea).toBeFocused();
            await pg.annotationTextarea.fill("Custom remark");
            await expect(pg.annotationTextarea).toHaveValue("Custom remark");
            await expect.poll(() => pg.countKonvaShapes("Text")).toBe(before + 1);

            const deleteText = pg.textEditingToolbar.getByRole("button", { name: "Delete annotation" });
            await deleteText.click();
            await expect.poll(() => pg.countKonvaShapes("Text")).toBe(before);
        });

        test("applies bold formatting to a text annotation", async ({ page }) => {
            const pg = new EditorPage(page);
            await pg.waitForEditorReady();

            await pg.textToolButton.click();
            await pg.drawBox(490, 440, 640, 490);
            await expect(pg.annotationTextarea).toBeFocused();
            await pg.annotationTextarea.fill("Bold remark");

            const bold = pg.textEditingToolbar.getByRole("button", { name: "Bold" });
            await expect(bold).toHaveAttribute("aria-pressed", "false");
            await bold.click();
            await expect(bold).toHaveAttribute("aria-pressed", "true");
        });
    });
});
