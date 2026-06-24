import { test, expect } from "@playwright/test";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { getProjects, importProject, deleteProject } from "../utils/project.api.ts";
import { deleteCatalog } from "../utils/catalog.api.ts";
import { buildTestId } from "../builder/test-data.builder.ts";
import { EditorPage } from "../pages/editor.page.ts";
import threatsFixture from "../fixtures/threats.json" with { type: "json" };

// Fixture layout (Konva coordinates):
//   USERS component  — center (505, 345)  [x=465, y=305, w=80, h=80]
//   CLIENT component — center (850, 345)  [x=810, y=305, w=80, h=80]
//
// Connection "Client -> Users": waypoints [545, 345, 810, 345]
//   Horizontal segment at y=345 running from x=545 (USERS right edge)
//   to x=810 (CLIENT left edge). Midpoint: (677, 345).

const CONNECTION_MID_X = 677;
const CONNECTION_MID_Y = 345;

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
    if (catalogId !== undefined && !stillUsed) {
        await deleteCatalog(request, token, catalogId);
    }
});

test.describe("Connection editing — pin behavior", () => {
    test("a plain click selects a connection without pinning it", async ({ page }) => {
        const editor = new EditorPage(page);

        // Click the midpoint of the "Client -> Users" connection segment.
        // Waypoints [545, 345, 810, 345]: horizontal line at y=345 from x=545 to x=810.
        // Midpoint (677, 345) lands on the Konva hit-line, away from both components.
        await editor.clickCanvas(CONNECTION_MID_X, CONNECTION_MID_Y);

        // The connection sidebar TextField renders with the connection name only when a
        // connection is selected — this proves the click actually hit the connection.
        // EditorSidebarSelectedConnection mounts only when selectedConnectionId is non-null;
        // its TextField (the sole textbox in the sidebar) shows the connection name.
        await expect(page.getByRole("textbox").first()).toHaveValue("Connection: Client -> Users");

        // The connection is selected but NOT pinned → no "Reset routing" button.
        await expect(page.getByRole("button", { name: "Reset routing" })).toHaveCount(0);
    });

    test("dragging a connection segment pins it; reset routing un-pins", async ({ page }) => {
        const editor = new EditorPage(page);

        // First click the segment to select the connection — this confirms the hit-line
        // is reachable at these coordinates before attempting the drag.
        await editor.clickCanvas(CONNECTION_MID_X, CONNECTION_MID_Y);

        // Drag the same segment well past the 8px Konva dragDistance pin threshold.
        // toCanvasPosition (private) returns canvas-relative coords; add the canvas
        // bounding box origin to get absolute page coordinates for page.mouse.
        const start = await (
            editor as unknown as {
                toCanvasPosition: (x: number, y: number) => Promise<{ x: number; y: number }>;
            }
        ).toCanvasPosition(CONNECTION_MID_X, CONNECTION_MID_Y);
        const canvasBox = await editor["canvas"].boundingBox();
        if (!canvasBox) {
            throw new Error("Canvas bounding box unavailable");
        }
        const pageX = canvasBox.x + start.x;
        const pageY = canvasBox.y + start.y;

        // Press-drag downward; 60px screen pixels far exceeds the 8px Konva dragDistance.
        // Use a small delay after mousedown so the Konva hit-test registers before the move.
        await page.mouse.move(pageX, pageY);
        await page.mouse.down();
        await page.waitForTimeout(50);
        await page.mouse.move(pageX, pageY + 60, { steps: 10 });
        await page.mouse.up();

        // A real drag pins the connection → "Reset routing" button appears.
        const resetButton = page.getByRole("button", { name: "Reset routing" });
        await expect(resetButton).toBeVisible();

        // Clicking reset routing un-pins the connection → button disappears.
        await resetButton.click();
        await expect(resetButton).toHaveCount(0);
    });
});
