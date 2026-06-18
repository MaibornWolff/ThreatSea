import type { Page, Locator } from "@playwright/test";
import path from "path";
import { BasePage } from "./base.page.ts";

export class EditorPage extends BasePage {
    readonly canvas: Locator;

    // Context menu
    readonly contextMenu: Locator;
    readonly createCommunicationButton: Locator;
    readonly communicationNameInput: Locator;
    readonly communicationIconButton: Locator;
    readonly saveCommunicationButton: Locator;
    readonly communicationListItem: Locator;

    // Component sidebar
    readonly componentAssetSearchField: Locator;
    readonly componentAssetSearchResults: Locator;
    readonly componentAssetSearchContainer: Locator;

    // POA sidebar
    readonly poaAssetSearchField: Locator;
    readonly poaAssetSearchContainer: Locator;
    readonly poaBreadcrumbComponent: Locator;

    // Communication sidebar
    readonly communicationAssetSearchField: Locator;

    // Shared asset search results (POA + Communication sidebars)
    readonly assetSearchResults: Locator;

    // Asset edit modal
    readonly assetCreationModalNameInput: Locator;
    readonly saveButton: Locator;
    readonly cancelButton: Locator;

    // Custom component context menu + dialog
    readonly addCustomComponentButton: Locator;
    readonly customComponentsToggle: Locator;
    readonly componentDialog: Locator;
    readonly componentNameInput: Locator;
    readonly componentDialogSaveButton: Locator;
    readonly iconRequiredError: Locator;
    readonly poaRequiredError: Locator;
    readonly deleteComponentMenuItem: Locator;
    readonly confirmButton: Locator;

    // Drawing toolbar (annotations)
    readonly centerEditorButton: Locator;
    readonly exportSystemImageButton: Locator;
    readonly shapesButton: Locator;
    readonly pencilButton: Locator;
    readonly textToolButton: Locator;
    readonly deleteAnnotationButton: Locator;
    readonly textEditingToolbar: Locator;
    readonly annotationTextarea: Locator;

    constructor(page: Page) {
        super(page);
        this.canvas = page.locator("canvas").nth(2);
        this.contextMenu = page.getByTestId("context-menu");
        this.createCommunicationButton = page.getByTestId("create-communication-button");
        this.communicationNameInput = page.locator('[data-testid="communication-name"] input');
        this.communicationIconButton = page.getByTestId("communication-icon");
        this.saveCommunicationButton = page.getByTestId("save-communication");
        this.communicationListItem = page.getByTestId("communication-list-item");

        this.componentAssetSearchField = page.locator('[data-testid="selected-component-asset-search-field"] input');
        this.componentAssetSearchResults = page.getByTestId("selected-component-asset-search-results");
        this.componentAssetSearchContainer = page.locator('[data-testid="selected-component-asset-search-field"]');

        this.poaAssetSearchField = page.locator('[data-testid="selected-point-of-attack-asset-search-field"] input');
        this.poaAssetSearchContainer = page.locator('[data-testid="selected-point-of-attack-asset-search-field"]');
        this.poaBreadcrumbComponent = page.getByTestId("poa-breadcrumb-component");

        this.communicationAssetSearchField = page.locator(
            '[data-testid="selected-communication-asset-search-field"] input'
        );

        this.assetSearchResults = page.getByTestId("asset-search-results");

        this.assetCreationModalNameInput = page.locator('[data-testid="asset-creation-modal_name-input"]');
        this.saveButton = page.locator('[data-testid="save-button"]');
        this.cancelButton = page.locator('[data-testid="cancel-button"]');

        // The "+" on the Custom row and the dialog have no data-testid, so rely on
        // the MUI add-icon test id and accessible roles/labels instead.
        this.addCustomComponentButton = this.contextMenu.locator('[data-testid="AddIcon"]');
        this.customComponentsToggle = this.contextMenu.getByText("Custom", { exact: true });
        this.componentDialog = page.getByRole("dialog");
        this.componentNameInput = this.componentDialog.getByRole("textbox");
        this.componentDialogSaveButton = this.componentDialog.getByRole("button", { name: "Save", exact: true });
        this.iconRequiredError = this.componentDialog.getByText("An icon is required");
        this.poaRequiredError = this.componentDialog.getByText("At least one point of attack must be selected");
        this.deleteComponentMenuItem = page.getByTestId("DeleteComponent");
        this.confirmButton = page.getByTestId("confirm-button");

        // Toolbar buttons carry no data-testid; they expose i18n aria-labels (en bundle).
        this.centerEditorButton = page.getByRole("button", { name: "Center editor" });
        this.exportSystemImageButton = page.getByRole("button", { name: "Export System Image" });
        this.shapesButton = page.getByRole("button", { name: "Shapes" });
        this.pencilButton = page.getByRole("button", { name: "Pencil", exact: true });
        this.textToolButton = page.getByRole("button", { name: "Text", exact: true });
        // Unambiguous for a selected shape; the floating text toolbar adds one only while editing text.
        this.deleteAnnotationButton = page.getByRole("button", { name: "Delete annotation" });
        this.textEditingToolbar = page.locator(".MuiPaper-root[data-edit-protected]");
        this.annotationTextarea = page.locator("textarea");
    }

    async goto(projectId: number): Promise<void> {
        await this.page.goto(`/projects/${projectId}/system`);
    }

    async waitForEditorReady(): Promise<void> {
        await this.page.waitForURL(/\/projects\/\d+\/system/);
        await this.canvas.waitFor({ state: "visible" });
        // Auto-centering runs in requestAnimationFrame after data loads;
        // wait for it to settle before interacting with the canvas.
        await this.page.waitForTimeout(500);
    }

    private async toCanvasPosition(konvaX: number, konvaY: number): Promise<{ x: number; y: number }> {
        return this.page.evaluate(
            ({ kx, ky }) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const stage = (globalThis as any).Konva?.stages?.[0];
                if (!stage) {
                    throw new Error("No Konva stage found");
                }
                const layer = stage.children?.[2];
                if (!layer) {
                    throw new Error("Expected Konva layer (stage.children[2]) not found");
                }
                return {
                    x: (kx + layer.x()) * stage.scaleX() + stage.x(),
                    y: (ky + layer.y()) * stage.scaleY() + stage.y(),
                };
            },
            { kx: konvaX, ky: konvaY }
        );
    }

    async clickCanvas(x: number, y: number): Promise<void> {
        await this.waitForEditorReady();
        const pos = await this.toCanvasPosition(x, y);
        await this.canvas.click({ position: pos });
    }

    async rightClickCanvas(): Promise<void> {
        await this.waitForEditorReady();
        await this.canvas.click({ button: "right" });
    }

    async openContextMenu(): Promise<void> {
        await this.rightClickCanvas();
        await this.contextMenu.waitFor({ state: "visible" });
    }

    async openAddCustomComponentDialog(): Promise<void> {
        await this.openContextMenu();
        await this.addCustomComponentButton.click();
        await this.componentDialog.waitFor({ state: "visible" });
    }

    async expandCustomComponents(): Promise<void> {
        await this.customComponentsToggle.click();
    }

    standardIconButton(name: string): Locator {
        return this.componentDialog.getByRole("button", { name, exact: true });
    }

    poaSwitch(label: string): Locator {
        return this.componentDialog.getByRole("switch", { name: label });
    }

    async uploadCustomIcon(): Promise<void> {
        // PLAYWRIGHT_FRONTEND_ROOT is set in playwright.config.ts (avoids import.meta.url cache dir issues).
        const iconPath = path.join(process.env["PLAYWRIGHT_FRONTEND_ROOT"]!, "playwright/fixtures/custom-icon.png");
        await this.componentDialog.locator('input[type="file"]').setInputFiles(iconPath);
    }

    customComponentEntry(name: string): Locator {
        return this.contextMenu.getByRole("listitem").filter({ hasText: name });
    }

    customComponentMenuButton(name: string): Locator {
        return this.customComponentEntry(name).locator('[data-testid="MoreVertIcon"]');
    }

    poaSwitchButton(poa: string): Locator {
        return this.page.getByTestId(`poa-switch-${poa}`);
    }

    connectedComponentName(): Locator {
        return this.page.getByTestId("connected-component-name");
    }

    wifiIcon(): Locator {
        return this.page.getByTestId("WifiIcon");
    }

    shapeToolButton(name: string): Locator {
        return this.page.getByRole("button", { name, exact: true });
    }

    // Color picker preset chips are labelled by their hex value (e.g. "#e74c3c").
    colorPresetChip(hex: string): Locator {
        return this.page.getByRole("button", { name: hex });
    }

    async selectShapeTool(name: string): Promise<void> {
        await this.shapesButton.click();
        await this.shapeToolButton(name).click();
    }

    private async canvasBox(): Promise<{ x: number; y: number; width: number; height: number }> {
        const box = await this.canvas.boundingBox();
        if (!box) {
            throw new Error("Canvas bounding box unavailable");
        }
        return box;
    }

    private async toPagePoint(
        box: { x: number; y: number; width: number; height: number },
        konvaX: number,
        konvaY: number
    ): Promise<{ x: number; y: number }> {
        const pos = await this.toCanvasPosition(konvaX, konvaY);
        if (pos.x < 0 || pos.y < 0 || pos.x > box.width || pos.y > box.height) {
            throw new Error(`Konva point (${konvaX}, ${konvaY}) maps outside the canvas viewport`);
        }
        return { x: box.x + pos.x, y: box.y + pos.y };
    }

    // Pause between pointer steps so React commits the mousedown draw-preview before mouseup;
    // a too-fast synthetic drag would commit a still-null preview and draw nothing.
    private static readonly DRAW_STEP_DELAY_MS = 100;

    private async pressDragThrough(points: { x: number; y: number }[]): Promise<void> {
        const [first, ...rest] = points;
        if (!first) {
            throw new Error("A drag needs at least one point");
        }
        await this.page.mouse.move(first.x, first.y);
        await this.page.mouse.down();
        await this.page.waitForTimeout(EditorPage.DRAW_STEP_DELAY_MS);
        for (const point of rest) {
            await this.page.mouse.move(point.x, point.y, { steps: 5 });
            await this.page.waitForTimeout(EditorPage.DRAW_STEP_DELAY_MS);
        }
        await this.page.mouse.up();
    }

    /** Press-drag from one Konva point to another to draw a rect/circle/line/arrow. */
    async drawBox(fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
        await this.waitForEditorReady();
        const box = await this.canvasBox();
        const from = await this.toPagePoint(box, fromX, fromY);
        const to = await this.toPagePoint(box, toX, toY);
        // The midpoint keeps the rAF-throttled preview tracking before the final corner.
        await this.pressDragThrough([from, { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }, to]);
    }

    /** Press-drag through a list of Konva points to draw a freehand stroke. */
    async drawFreehand(points: [number, number][]): Promise<void> {
        await this.waitForEditorReady();
        const box = await this.canvasBox();
        const pagePoints: { x: number; y: number }[] = [];
        for (const [konvaX, konvaY] of points) {
            pagePoints.push(await this.toPagePoint(box, konvaX, konvaY));
        }
        await this.pressDragThrough(pagePoints);
    }

    /** Count Konva nodes of a given className (e.g. "Rect", "Circle", "Line") across the stage. */
    async countKonvaShapes(className: string): Promise<number> {
        return this.page.evaluate((cn) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const stage = (globalThis as any).Konva?.stages?.[0];
            if (!stage) {
                throw new Error("No Konva stage found");
            }
            return stage.find(cn).length;
        }, className);
    }

    async getStageScale(): Promise<number> {
        return this.page.evaluate(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const stage = (globalThis as any).Konva?.stages?.[0];
            if (!stage) {
                throw new Error("No Konva stage found");
            }
            return stage.scaleX();
        });
    }

    async zoomIn(ticks = 3): Promise<void> {
        const box = await this.canvasBox();
        await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        for (let i = 0; i < ticks; i++) {
            await this.page.mouse.wheel(0, -120);
        }
    }

    async addCommunication(): Promise<void> {
        await this.clickCanvas(880, 375);
        await this.createCommunicationButton.waitFor({ state: "visible" });
        await this.createCommunicationButton.click();
        await this.communicationNameInput.waitFor({ state: "visible" });
        await this.communicationNameInput.fill("Sample Communication");
        await this.communicationIconButton.click();
        await this.wifiIcon().click();
        await this.saveCommunicationButton.click();
    }
}
