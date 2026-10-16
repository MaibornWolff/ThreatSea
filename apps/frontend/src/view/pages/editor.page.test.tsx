import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Mock } from "vitest";
import type { InitialEntry } from "react-router";
import { Route, Routes, useLocation } from "react-router";
import { EditorPage } from "./editor.page";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { konvaTestControls } from "#test-utils/konva-mock.ts";
import {
    createAnnotation,
    createAsset,
    createAugmentedConnection,
    createCommunicationInterface,
    createConnectionPoint,
    createPointOfAttack,
    createProject,
    createSystemComponent,
} from "#test-utils/builders.ts";
import { mockUseAlert, mockUseAssets, mockUseConfirm, mockUseEditor } from "#test-utils/mock-hooks.ts";
import type { useEditor } from "#application/hooks/use-editor.hook.ts";
import type { RootState } from "#application/store.ts";
import type { EnhancedComponent } from "#utils/enhance-components.ts";
import { systemAnnotationsAdapter } from "#application/adapters/system-annotations.adapter.ts";
import { AnchorOrientation, type Annotation } from "#api/types/system.types.ts";
import type { EditorComponentConnectionLine } from "#application/adapters/editor-component-connection-lines.adapter.ts";
import { moveSegment } from "#utils/connection-waypoints.ts";
import { STANDARD_ICON_IMAGES } from "#view/icons/standard-icons.ts";
import { DEFAULT_ANNOTATION_COLOR } from "#view/colors/annotation.colors.ts";
import { MAX_STAGE_SCALE, MIN_STAGE_SCALE } from "#view/components/editor-components/editor-stage.component.tsx";
import { USER_ROLES } from "#api/types/user-roles.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import editorReducer from "#application/reducers/editor.reducer.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import projectsReducer from "#application/reducers/projects.reducer.ts";
import systemReducer from "#application/reducers/system.reducer.ts";

type EditorHookResult = ReturnType<typeof useEditor>;

// --- Hook spies ---
//
// Installed per test rather than once at module load. These are `vi.spyOn`
// instances on shared hook modules, and `restoreMocks: true` tears them down
// after every test — a module-level install would only survive the first one.

let editor: EditorHookResult;
let openConfirm: Mock;
let showErrorMessage: Mock;
let loadAssets: Mock;

/**
 * Spies on useEditor and returns one fixed result for every call. Memoized children (sidebar
 * panels, connection overlays) keep handlers from an earlier render, so the page must see the
 * same vi.fn instances on every render for assertions to observe those calls. The editor
 * context menu calls useEditor too and shares the result. Also stored in `editor` for assertions.
 */
const stubUseEditor = (overrides: Partial<EditorHookResult> = {}): EditorHookResult => {
    const spy = mockUseEditor(overrides);
    const result = spy.getMockImplementation()!({ projectId: 1 }) as EditorHookResult;
    spy.mockReturnValue(result);
    editor = result;
    return result;
};

const stubUseAssets = (items = [createAsset()]): void => {
    mockUseAssets({ items, loadAssets });
};

beforeEach(() => {
    openConfirm = vi.fn();
    showErrorMessage = vi.fn();
    loadAssets = vi.fn();
    stubUseEditor();
    mockUseAssets({ loadAssets });
    mockUseConfirm({ openConfirm });
    mockUseAlert({ showErrorMessage });
});

// --- Module mocks: only page chrome and the API-backed dialog routes ---

vi.mock("../components/create-page.component", () => ({
    CreatePage: (_Header: unknown, Body: unknown) => Body,
}));

vi.mock("../components/header-utility-controls.component", () => ({
    HeaderUtilityControls: () => null,
}));

vi.mock("../components/page.component", () => ({
    Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("./asset-dialog.page", () => ({
    default: () => <div data-testid="asset-dialog-page" />,
}));

vi.mock("./component-dialog.page", () => ({
    default: () => <div data-testid="component-dialog-page" />,
}));

// Debounce timing is not page behavior; without this every typing test needs fake timers.
vi.mock("#hooks/useDebounce.ts", () => ({
    useDebounce: (callback: () => void) => callback,
}));

// --- Helpers ---

// Makes the router's location state observable, e.g. after the page replaced the history entry.
const LocationStateProbe = () => {
    const location = useLocation();
    return <output data-testid="location-state">{JSON.stringify(location.state)}</output>;
};

interface RenderEditorPageOptions {
    initialEntries?: InitialEntry[];
    role?: USER_ROLES;
    loadedProjectId?: number | null;
    editorState?: Partial<RootState["editor"]>;
    systemState?: Partial<RootState["system"]>;
}

const renderEditorPage = ({
    initialEntries = ["/projects/1/system"],
    role = USER_ROLES.EDITOR,
    loadedProjectId = 1,
    editorState = {},
    systemState = {},
}: RenderEditorPageOptions = {}) => {
    const page = (
        <>
            <Routes>
                <Route path="/projects/:projectId/system/*" element={<EditorPage />} />
            </Routes>
            <LocationStateProbe />
        </>
    );
    const result = renderWithProviders(page, {
        initialEntries,
        preloadedState: {
            projects: { ...projectsReducer(undefined, { type: "@@INIT" }), current: createProject({ role }) },
            editor: {
                ...editorReducer(undefined, { type: "@@INIT" }),
                // Already centered, so the first-load fit-to-view stays out of unrelated tests.
                lastCenteredProjectId: 1,
                ...editorState,
            },
            system: { ...systemReducer(undefined, { type: "@@INIT" }), loadedProjectId, ...systemState },
        },
    });
    // EditorPage is memoized without props and the stubbed useEditor does not subscribe to the
    // store, so re-render it through a store change it observes; it then reads the current stub.
    let rerenderCount = 0;
    const rerenderPage = (): void => {
        rerenderCount += 1;
        // A different color each time: an unchanged store would not re-render the page.
        const color = `#${rerenderCount.toString(16).padStart(6, "0")}`;
        act(() => {
            result.store.dispatch(SystemActions.setDefaultAnnotationColor({ projectId: 1, color }));
        });
    };
    return { ...result, rerenderPage };
};

// The sidebar is shown and hidden through its inline `right` style. The text-editing toolbar is
// the only other edit-protected element, and it lives inside the canvas' Html portal.
const getSidebar = (): HTMLElement => {
    const sidebar = Array.from(document.querySelectorAll<HTMLElement>("[data-edit-protected]")).find(
        (element) => element.closest('[data-testid="konva-html"]') === null
    );
    if (!sidebar) {
        throw new Error("Editor sidebar not found");
    }
    return sidebar;
};

const SIDEBAR_OPEN = "40px";
const SIDEBAR_CLOSED = "-600px";

const getStage = (): HTMLElement => screen.getByTestId("konva-stage");

// Requests a frame after the page's pending one; frames run in request order, so this resolves
// once the page's throttled mousemove has been flushed.
const flushAnimationFrame = () => act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));

const annotationsOf = (...annotations: Annotation[]) =>
    systemAnnotationsAdapter.setAll(systemAnnotationsAdapter.getInitialState(), annotations);

// The text-editing toolbar is the edit-protected panel rendered inside the canvas' Html portal.
const getTextToolbar = (): HTMLElement => {
    const toolbar = Array.from(document.querySelectorAll<HTMLElement>("[data-edit-protected]")).find(
        (element) => element.closest('[data-testid="konva-html"]') !== null
    );
    if (!toolbar) {
        throw new Error("Text editing toolbar not found");
    }
    return toolbar;
};

// A SystemComponent renders as a Group directly inside the component layer; its name label is a
// Text node somewhere below it.
const getComponentRoot = (name: string): HTMLElement => {
    const label = screen.getAllByTestId("konva-text").find((text) => text.dataset["text"] === name);
    const root = label?.closest<HTMLElement>('[data-testid="konva-layer"] > [data-testid="konva-group"]');
    if (!root) {
        throw new Error(`Component "${name}" not found on the canvas`);
    }
    return root;
};

// The component's own icon is the first Image below its root; the plug icon's Image comes later.
const getComponentIcon = (name: string): HTMLElement =>
    within(getComponentRoot(name)).getAllByTestId("konva-image")[0]!;

// The four "+" anchors of a component, in render order: top, right, bottom, left.
const getAnchors = (name: string): HTMLElement[] =>
    within(getComponentRoot(name))
        .getAllByTestId("konva-text")
        .filter((text) => text.dataset["text"] === "+")
        .map((text) => text.closest<HTMLElement>('[data-testid="konva-group"]')!);

// A drawn connection renders a wide transparent hit line and a non-listening visible line.
const getConnectionHitLines = (): HTMLElement[] =>
    screen.queryAllByTestId("konva-line").filter((line) => line.dataset["strokeWidth"] === "15");
const getConnectionVisibleLines = (): HTMLElement[] =>
    screen.queryAllByTestId("konva-line").filter((line) => line.dataset["listening"] === "false");

// Dashed lines are connection previews (new connection or a component being dragged).
const getPreviewLines = (): HTMLElement[] =>
    screen.queryAllByTestId("konva-line").filter((line) => line.dataset["dash"] === "[20,5]");

// The plug icon that opens the communication menu: a Group holding the radius-12 circle.
const getPlugIcon = (name: string): HTMLElement => {
    const circle = within(getComponentRoot(name))
        .getAllByTestId("konva-circle")
        .find((candidate) => candidate.dataset["radius"] === "12");
    const plugIcon = circle?.closest<HTMLElement>('[data-testid="konva-group"]');
    if (!plugIcon) {
        throw new Error(`Plug icon of "${name}" not found`);
    }
    return plugIcon;
};

// Segment hit-lines of ConnectionEditHandles are the only lines with a drag threshold.
const getEditHandleSegments = (): HTMLElement[] =>
    screen.queryAllByTestId("konva-line").filter((line) => line.dataset["dragDistance"] === "8");

// Vertex handles are the only circles with the handle radius.
const getEditHandleVertices = (): HTMLElement[] =>
    screen.queryAllByTestId("konva-circle").filter((circle) => circle.dataset["radius"] === "6");

// useEditor hands the canvas components enhanced with selection and connection-start data.
const createCanvasComponent = (overrides: Parameters<typeof createSystemComponent>[0] = {}): EnhancedComponent => ({
    ...createSystemComponent(overrides),
    selected: false,
    startAnchor: null,
    symbol: null,
    ...overrides,
});

const pointOfAttack = createPointOfAttack({
    id: "poa-1",
    type: POINTS_OF_ATTACK.USER_INTERFACE,
    componentId: "comp-1",
    componentName: "Web Server",
});

const webServer = createCanvasComponent({
    id: "comp-1",
    name: "Web Server",
    type: STANDARD_COMPONENT_TYPES.SERVER,
    x: 100,
    y: 100,
    selected: false,
    pointsOfAttack: [pointOfAttack],
});

const billingService = createCanvasComponent({
    id: "comp-2",
    name: "Billing Service",
    type: STANDARD_COMPONENT_TYPES.SERVER,
    x: 300,
    y: 100,
    selected: false,
});

const selectWebServer = (overrides: Partial<EditorHookResult> = {}): EditorHookResult =>
    stubUseEditor({
        components: [webServer, billingService],
        selectedComponent: webServer,
        selectedComponentId: webServer.id,
        pointsOfAttackOfSelectedComponent: [pointOfAttack],
        ...overrides,
    });

// Accepts the confirm dialog the page asked for last.
const acceptConfirm = () => {
    const { onAccept, state } = openConfirm.mock.lastCall![0];
    act(() => onAccept(state));
};

// --- Tests ---

describe("EditorPage", () => {
    describe("loading & mount", () => {
        it("shows a progress bar instead of the canvas until the system is initialized", () => {
            stubUseEditor({ initialized: false });

            renderEditorPage();

            expect(screen.getByRole("progressbar")).toBeInTheDocument();
            expect(screen.queryByTestId("konva-stage")).not.toBeInTheDocument();
        });

        it("loads the system, the component types and the assets on mount", () => {
            renderEditorPage();

            expect(editor.loadSystem).toHaveBeenCalledOnce();
            expect(editor.loadComponentTypes).toHaveBeenCalledOnce();
            expect(loadAssets).toHaveBeenCalled();
        });

        it("switches the page header to the project navigation", () => {
            const { store } = renderEditorPage();

            expect(store.getState().navigation).toMatchObject({
                showProjectCatalogueInnerNavigation: true,
                showUniversalHeaderNavigation: true,
                showProjectInfo: true,
                getCatalogInfo: false,
            });
        });

        it("names the browser tab after the system view", () => {
            renderEditorPage();

            expect(document.title).toBe("ThreatSea - System");
        });

        it("offers the annotation tools to an editor", () => {
            renderEditorPage();

            expect(screen.getByRole("button", { name: "Shapes" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Pencil" })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: "Text" })).toBeInTheDocument();
        });

        it("hides the annotation tools from a viewer", () => {
            renderEditorPage({ role: USER_ROLES.VIEWER });

            expect(screen.getByRole("button", { name: "Center editor" })).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Shapes" })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Pencil" })).not.toBeInTheDocument();
            expect(screen.queryByRole("button", { name: "Text" })).not.toBeInTheDocument();
        });
    });

    describe("canvas: stage interactions", () => {
        const rectangle = createAnnotation({ id: "ann-1", type: "rect" });

        it("deselects everything, closes the sidebar and shows the move cursor on a left click on the empty stage", () => {
            const { store } = renderEditorPage({
                editorState: { selectedAnnotation: "ann-1" },
                systemState: { annotations: annotationsOf(rectangle) },
            });

            fireEvent.mouseDown(getStage(), { button: 0 });

            expect(editor.deselectComponent).toHaveBeenCalledOnce();
            expect(editor.deselectConnection).toHaveBeenCalledOnce();
            expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
            expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
            expect(editor.deselectConnector).toHaveBeenCalledOnce();
            expect(store.getState().editor.selectedAnnotation).toBeNull();
            expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            expect(getStage().style.cursor).toBe("move");
        });

        it("pans the layer by the summed movement of one frame, scaled by speed and zoom", async () => {
            stubUseEditor({ layerPosition: { x: 10, y: 20 } });
            renderEditorPage({ editorState: { stageScale: 2 } });

            fireEvent.mouseDown(getStage(), { button: 0 });
            fireEvent.mouseMove(getStage(), { movementX: 10, movementY: 4 });
            fireEvent.mouseMove(getStage(), { movementX: 6, movementY: 2 });
            await flushAnimationFrame();

            // speed 1.5 / stage scale 2 = 0.75 per pixel moved
            expect(editor.setLayerPosition).toHaveBeenCalledOnce();
            expect(editor.setLayerPosition).toHaveBeenCalledWith(10 + 16 * 0.75, 20 + 6 * 0.75);
        });

        it("stops panning on mouse up and resets the cursor", async () => {
            renderEditorPage();
            fireEvent.mouseDown(getStage(), { button: 0 });

            fireEvent.mouseUp(getStage(), { button: 0 });
            fireEvent.mouseMove(getStage(), { movementX: 10, movementY: 10 });
            await flushAnimationFrame();

            expect(getStage().style.cursor).toBe("default");
            expect(editor.setLayerPosition).not.toHaveBeenCalled();
        });

        it("stops panning when the pointer leaves the stage mid-pan", async () => {
            renderEditorPage();
            fireEvent.mouseDown(getStage(), { button: 0 });

            fireEvent.mouseLeave(getStage());
            fireEvent.mouseMove(getStage(), { movementX: 10, movementY: 10 });
            await flushAnimationFrame();

            expect(getStage().style.cursor).toBe("default");
            expect(editor.setLayerPosition).not.toHaveBeenCalled();
        });

        it("leaves the cursor alone when the pointer leaves without a pan", () => {
            renderEditorPage();

            fireEvent.mouseLeave(getStage());

            expect(getStage().style.cursor).toBe("");
        });

        it("does not deselect on a right-button press", () => {
            renderEditorPage();

            fireEvent.mouseDown(getStage(), { button: 2 });

            expect(editor.deselectComponent).not.toHaveBeenCalled();
            expect(getStage().style.cursor).toBe("");
        });

        it("does not deselect when the press lands on a component", () => {
            stubUseEditor({ components: [webServer] });
            renderEditorPage();

            fireEvent.mouseDown(within(getComponentRoot("Web Server")).getAllByTestId("konva-image")[0]!, {
                button: 0,
            });

            expect(editor.deselectComponent).not.toHaveBeenCalled();
        });

        it("ignores the stage press that follows a color-picker interaction within 500 ms", async () => {
            vi.useFakeTimers({ toFake: ["Date"] });
            try {
                vi.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));
                const user = userEvent.setup();
                const note = createAnnotation({ id: "ann-text", type: "text", text: "Note" });
                renderEditorPage({
                    editorState: { selectedAnnotation: "ann-text" },
                    systemState: { annotations: annotationsOf(note) },
                });

                await user.click(within(getTextToolbar()).getByRole("button", { name: "Pick color" }));
                fireEvent.mouseDown(getStage(), { button: 0 });
                expect(editor.deselectComponent).not.toHaveBeenCalled();

                vi.setSystemTime(new Date("2026-01-01T10:00:00.600Z"));
                fireEvent.mouseDown(getStage(), { button: 0 });
                expect(editor.deselectComponent).toHaveBeenCalledOnce();
            } finally {
                vi.useRealTimers();
            }
        });

        it("draws the new-connection preview to the pointer while a connection is open", async () => {
            stubUseEditor({
                components: [webServer, billingService],
                newConnection: {
                    from: { id: "comp-1", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.SERVER },
                },
                layerPosition: { x: 10, y: 20 },
            });
            renderEditorPage();

            fireEvent.mouseMove(getStage(), { clientX: 250, clientY: 150 });
            await flushAnimationFrame();

            const preview = screen.getAllByTestId("konva-line").find((line) => line.dataset["dash"] === "[20,5]");
            // Component center (100 + 50, 100 + 50) to the pointer in layer coordinates.
            expect(preview).toHaveAttribute("data-points", JSON.stringify([150, 150, 240, 130]));
        });

        it("forgets the preview end point once the connection is closed", async () => {
            const newConnection = {
                from: { id: "comp-1", anchor: AnchorOrientation.right, type: STANDARD_COMPONENT_TYPES.SERVER },
            };
            stubUseEditor({ components: [webServer], newConnection });
            const { rerenderPage } = renderEditorPage();
            fireEvent.mouseMove(getStage(), { clientX: 250, clientY: 150 });
            await flushAnimationFrame();

            stubUseEditor({ ...editor, newConnection: null });
            rerenderPage();
            fireEvent.mouseMove(getStage(), { clientX: 260, clientY: 160 });
            await flushAnimationFrame();
            stubUseEditor({ ...editor, newConnection });
            rerenderPage();

            // A reopened connection starts without the old end point.
            expect(getPreviewLines()[0]).toHaveAttribute("data-points", "[]");
        });

        it("does not pan after the page unmounted with a frame still pending", async () => {
            const { unmount } = renderEditorPage();
            fireEvent.mouseDown(getStage(), { button: 0 });
            fireEvent.mouseMove(getStage(), { movementX: 10, movementY: 10 });

            unmount();
            await flushAnimationFrame();

            expect(editor.setLayerPosition).not.toHaveBeenCalled();
        });

        describe("zoom", () => {
            it("zooms in around the pointer on a wheel up", () => {
                renderEditorPage();

                fireEvent.wheel(getStage(), { deltaY: -100, clientX: 100, clientY: 50 });

                const [scale, position] = vi.mocked(editor.setStageScale).mock.lastCall!;
                expect(scale).toBeCloseTo(1.1);
                expect(position.x).toBeCloseTo(100 - 100 * 1.1);
                expect(position.y).toBeCloseTo(50 - 50 * 1.1);
            });

            it("zooms out around the pointer on a wheel down", () => {
                renderEditorPage();

                fireEvent.wheel(getStage(), { deltaY: 100, clientX: 100, clientY: 50 });

                const [scale, position] = vi.mocked(editor.setStageScale).mock.lastCall!;
                expect(scale).toBeCloseTo(1 / 1.1);
                expect(position.x).toBeCloseTo(100 - 100 / 1.1);
                expect(position.y).toBeCloseTo(50 - 50 / 1.1);
            });

            it("does not zoom in beyond the maximum scale", () => {
                renderEditorPage({ editorState: { stageScale: MAX_STAGE_SCALE } });

                fireEvent.wheel(getStage(), { deltaY: -100, clientX: 0, clientY: 0 });

                expect(vi.mocked(editor.setStageScale).mock.lastCall![0]).toBe(MAX_STAGE_SCALE);
            });

            it("does not zoom out below the minimum scale", () => {
                renderEditorPage({ editorState: { stageScale: MIN_STAGE_SCALE } });

                fireEvent.wheel(getStage(), { deltaY: 100, clientX: 0, clientY: 0 });

                expect(vi.mocked(editor.setStageScale).mock.lastCall![0]).toBe(MIN_STAGE_SCALE);
            });
        });

        describe("cursor for annotation tools", () => {
            it("shows a text cursor for the text tool and a crosshair for the pencil", async () => {
                const user = userEvent.setup();
                renderEditorPage();

                await user.click(screen.getByRole("button", { name: "Text" }));
                expect(getStage().style.cursor).toBe("text");

                await user.click(screen.getByRole("button", { name: "Pencil" }));
                expect(getStage().style.cursor).toBe("crosshair");
            });

            it("restores the default cursor when the tool is turned off", async () => {
                const user = userEvent.setup();
                renderEditorPage();

                await user.click(screen.getByRole("button", { name: "Pencil" }));
                await user.click(screen.getByRole("button", { name: "Pencil" }));

                expect(getStage().style.cursor).toBe("default");
            });
        });
    });

    describe("keyboard", () => {
        const connection = createAugmentedConnection({
            id: "conn-1",
            fromComponent: webServer,
            toComponent: billingService,
        });

        it("deselects everything, closes the sidebar and drops the active annotation tool on Escape", async () => {
            const user = userEvent.setup();
            const { store } = renderEditorPage({ editorState: { annotationTool: "rect" } });

            await user.keyboard("{Escape}");

            expect(store.getState().editor.annotationTool).toBeNull();
            expect(editor.deselectComponent).toHaveBeenCalledOnce();
            expect(editor.deselectConnection).toHaveBeenCalledOnce();
            expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
            expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
            expect(editor.deselectConnector).toHaveBeenCalledOnce();
            expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
        });

        it("only closes an open communication menu on Escape", async () => {
            const user = userEvent.setup();
            stubUseEditor({ components: [webServer] });
            renderEditorPage();
            await user.click(getPlugIcon("Web Server"));
            expect(screen.getByText("Web Server: Communication Interface")).toBeVisible();

            await user.keyboard("{Escape}");

            expect(screen.getByText("Web Server: Communication Interface")).not.toBeVisible();
            expect(editor.deselectComponent).not.toHaveBeenCalled();
        });

        it.each(["Delete", "Backspace"])("asks before deleting the selected component on %s", async (key) => {
            const user = userEvent.setup();
            selectWebServer();
            renderEditorPage();

            await user.keyboard(`{${key}}`);

            expect(openConfirm).toHaveBeenCalledOnce();
            expect(openConfirm.mock.lastCall![0]).toMatchObject({
                message: "Do you really want to delete the component 'Web Server'?",
                acceptText: "Delete",
                cancelText: "Cancel",
            });
            expect(editor.removeComponent).not.toHaveBeenCalled();

            acceptConfirm();

            expect(editor.removeComponent).toHaveBeenCalledOnce();
            expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
        });

        it("does not offer to delete the component while one of its points of attack is selected", async () => {
            const user = userEvent.setup();
            selectWebServer({ selectedPointOfAttack: pointOfAttack });
            renderEditorPage();

            await user.keyboard("{Delete}");

            expect(openConfirm).not.toHaveBeenCalled();
        });

        it("asks before deleting the selected connection", async () => {
            const user = userEvent.setup();
            stubUseEditor({
                components: [webServer, billingService],
                connections: [connection],
                selectedConnection: connection,
                selectedConnectionId: "conn-1",
            });
            renderEditorPage();

            await user.keyboard("{Delete}");

            expect(openConfirm.mock.lastCall![0]).toMatchObject({
                message: "Do you really want to delete the connection 'Test Connection'?",
            });
            acceptConfirm();
            expect(editor.removeConnection).toHaveBeenCalledOnce();
            expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
        });

        it("removes the selected annotation without asking", async () => {
            const user = userEvent.setup();
            const rectangle = createAnnotation({ id: "ann-1", type: "rect" });
            const { store } = renderEditorPage({
                editorState: { selectedAnnotation: "ann-1" },
                systemState: { annotations: annotationsOf(rectangle) },
            });

            await user.keyboard("{Delete}");

            expect(store.getState().system.annotations.ids).toEqual([]);
            expect(store.getState().editor.selectedAnnotation).toBeNull();
            expect(openConfirm).not.toHaveBeenCalled();
            expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
        });

        it("keeps the selection while Backspace edits a text field in the sidebar", async () => {
            const user = userEvent.setup();
            selectWebServer();
            renderEditorPage();

            await user.click(screen.getByDisplayValue("Web Server"));
            await user.keyboard("{Backspace}");

            expect(openConfirm).not.toHaveBeenCalled();
            expect(editor.removeComponent).not.toHaveBeenCalled();
        });

        it("keeps the selected text annotation while Backspace edits its text area", async () => {
            const user = userEvent.setup();
            const note = createAnnotation({ id: "ann-text", type: "text", text: "Note" });
            const { store } = renderEditorPage({
                editorState: { selectedAnnotation: "ann-text" },
                systemState: { annotations: annotationsOf(note) },
            });

            await user.click(screen.getByRole("textbox"));
            await user.keyboard("{Backspace}");

            expect(store.getState().system.annotations.ids).toEqual(["ann-text"]);
        });

        it("handles a Delete dispatched on the window itself", () => {
            selectWebServer();
            renderEditorPage();

            fireEvent.keyUp(window, { key: "Delete" });

            expect(openConfirm).toHaveBeenCalledOnce();
        });

        it("does nothing on Delete without a selection", async () => {
            const user = userEvent.setup();
            renderEditorPage();

            await user.keyboard("{Delete}");

            expect(openConfirm).not.toHaveBeenCalled();
            expect(getSidebar().style.right).toBe("");
        });

        describe("arrow keys", () => {
            it("nudges the selected component by one grid step and reroutes its connections afterwards", async () => {
                const user = userEvent.setup();
                selectWebServer();
                renderEditorPage();

                await user.keyboard("{ArrowRight}");

                expect(editor.moveComponent).toHaveBeenCalledWith({
                    id: "comp-1",
                    x: 105,
                    y: 100,
                    gridX: 21,
                    gridY: 20,
                });
                // Rerouting is deferred by 250 ms so a burst of nudges reroutes once.
                expect(editor.updateConnectionsOfComponent).not.toHaveBeenCalled();
                await waitFor(() => expect(editor.updateConnectionsOfComponent).toHaveBeenCalledOnce());
            });

            it("does not move the component for a viewer", async () => {
                const user = userEvent.setup();
                selectWebServer();
                renderEditorPage({ role: USER_ROLES.VIEWER });

                await user.keyboard("{ArrowRight}");

                expect(editor.moveComponent).not.toHaveBeenCalled();
            });
        });
    });

    describe("context menu", () => {
        it("opens the component menu on a right click and deselects all but the annotation", () => {
            const rectangle = createAnnotation({ id: "ann-1", type: "rect" });
            const { store } = renderEditorPage({
                editorState: { selectedAnnotation: "ann-1" },
                systemState: { annotations: annotationsOf(rectangle) },
            });

            fireEvent.contextMenu(getStage(), { clientX: 120, clientY: 80, button: 2 });

            expect(screen.getByTestId("context-menu")).toBeVisible();
            expect(editor.deselectComponent).toHaveBeenCalledOnce();
            expect(editor.deselectConnection).toHaveBeenCalledOnce();
            expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
            expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
            expect(editor.deselectConnector).toHaveBeenCalledOnce();
            expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            expect(store.getState().editor.selectedAnnotation).toBe("ann-1");
        });

        it("adds the chosen component type at the grid-snapped pointer position", async () => {
            const user = userEvent.setup();
            stubUseEditor({ layerPosition: { x: 10, y: 20 } });
            renderEditorPage();

            fireEvent.contextMenu(getStage(), { clientX: 123, clientY: 84, button: 2 });
            await user.click(within(screen.getByTestId("context-menu")).getByText("Server"));

            // (123 - 10, 84 - 20) snapped down to the 5 px grid.
            expect(editor.addComponent).toHaveBeenCalledWith({
                x: 110,
                y: 60,
                gridX: 22,
                gridY: 12,
                componentType: expect.objectContaining({ id: STANDARD_COMPONENT_TYPES.SERVER }),
            });
        });

        it("does not open for a viewer", () => {
            renderEditorPage({ role: USER_ROLES.VIEWER });

            fireEvent.contextMenu(getStage(), { clientX: 120, clientY: 80, button: 2 });

            expect(screen.getByTestId("context-menu")).not.toBeVisible();
            expect(editor.deselectComponent).not.toHaveBeenCalled();
        });
    });

    describe("components", () => {
        describe("selecting by icon click", () => {
            it("selects the component, clears the other selections and opens the sidebar", () => {
                stubUseEditor({ components: [webServer] });
                const rectangle = createAnnotation({ id: "ann-1", type: "rect" });
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-1" },
                    systemState: { annotations: annotationsOf(rectangle) },
                });

                fireEvent.click(getComponentIcon("Web Server"));

                expect(editor.setAssetSearchValue).toHaveBeenCalledWith("");
                expect(editor.selectComponent).toHaveBeenCalledWith("comp-1");
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
                expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(store.getState().editor.selectedAnnotation).toBeNull();
                expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
            });

            it("ignores the click while an annotation tool is active", () => {
                stubUseEditor({ components: [webServer] });
                renderEditorPage({ editorState: { annotationTool: "rect" } });

                fireEvent.click(getComponentIcon("Web Server"));

                expect(editor.selectComponent).not.toHaveBeenCalled();
            });

            // React drops click events of the secondary button, so the middle button stands in for
            // any non-primary click here and below.
            it("ignores a non-primary button click", () => {
                stubUseEditor({ components: [webServer] });
                renderEditorPage();

                fireEvent.click(getComponentIcon("Web Server"), { button: 1 });

                expect(editor.selectComponent).not.toHaveBeenCalled();
            });

            it("only closes an open communication menu", async () => {
                const user = userEvent.setup();
                stubUseEditor({ components: [webServer] });
                renderEditorPage();
                await user.click(getPlugIcon("Web Server"));

                fireEvent.click(getComponentIcon("Web Server"));

                expect(screen.getByText("Web Server: Communication Interface")).not.toBeVisible();
                expect(editor.selectComponent).not.toHaveBeenCalled();
            });
        });

        describe("dragging", () => {
            const connection = createAugmentedConnection({
                id: "conn-1",
                fromComponent: webServer,
                toComponent: billingService,
            });

            it("marks the dragged component in use, selects it and closes the sidebar on drag start", () => {
                stubUseEditor({ components: [webServer, billingService] });
                renderEditorPage();

                fireEvent.dragStart(getComponentRoot("Web Server"));

                expect(editor.addInUseComponent).toHaveBeenCalledWith("comp-1");
                expect(editor.selectComponent).toHaveBeenCalledWith("comp-1");
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
                expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            });

            it("hides each attached connection and shows a preview line from the dragged side", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [connection] });
                renderEditorPage();

                fireEvent.dragStart(getComponentRoot("Web Server"));

                expect(editor.setConnectionVisibility).toHaveBeenCalledWith("conn-1", false);
                expect(editor.addComponentConnectionLine).toHaveBeenCalledWith("comp-1", "right", "comp-2", "left");
            });

            it("anchors the preview line at the target end when the connection's target is dragged", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [connection] });
                renderEditorPage();

                fireEvent.dragStart(getComponentRoot("Billing Service"));

                expect(editor.addComponentConnectionLine).toHaveBeenCalledWith("comp-2", "left", "comp-1", "right");
            });

            it("hides but draws no preview for a connection without resolved endpoint components", () => {
                const unresolved = { ...connection, from: { ...connection.from, component: undefined } };
                stubUseEditor({ components: [webServer, billingService], connections: [unresolved] });
                renderEditorPage();

                fireEvent.dragStart(getComponentRoot("Web Server"));

                expect(editor.setConnectionVisibility).toHaveBeenCalledWith("conn-1", false);
                expect(editor.addComponentConnectionLine).not.toHaveBeenCalled();
            });

            it("snaps the dragged component to the grid and moves it there", () => {
                stubUseEditor({ components: [webServer] });
                renderEditorPage();
                const target = { position: () => ({ x: 123, y: 87 }), setPosition: vi.fn() };

                fireEvent.drag(getComponentRoot("Web Server"), { target });

                expect(target.setPosition).toHaveBeenCalledWith({ x: 120, y: 85 });
                expect(editor.moveComponent).toHaveBeenCalledWith({
                    id: "comp-1",
                    x: 120,
                    y: 85,
                    gridX: 24,
                    gridY: 17,
                });
                expect(editor.setShowHelpLines).toHaveBeenCalledWith(true);
            });

            it("draws help lines around the snapped position once they are shown", () => {
                stubUseEditor({ components: [webServer], layerPosition: { x: 10, y: 20 } });
                const { rerenderPage } = renderEditorPage();

                fireEvent.drag(getComponentRoot("Web Server"), {
                    target: { position: () => ({ x: 123, y: 87 }), setPosition: vi.fn() },
                });
                stubUseEditor({ ...editor, showHelpLines: true });
                rerenderPage();

                const pointsOfLines = screen.getAllByTestId("konva-line").map((line) => line.dataset["points"]);
                // Snapped (120, 85), offset by the 9 / 71 px icon box and the layer position (10, 20).
                expect(pointsOfLines).toEqual(
                    expect.arrayContaining([
                        JSON.stringify([-1000, 114, 10000, 114]),
                        JSON.stringify([-1000, 176, 10000, 176]),
                        JSON.stringify([139, -1000, 139, 10000]),
                        JSON.stringify([201, -1000, 201, 10000]),
                    ])
                );
            });

            it("releases the component, hides the help lines and restores its connections on drag end", () => {
                const ownLine: EditorComponentConnectionLine = {
                    id: "line-1",
                    draggedComponentInfo: { id: "comp-1", anchor: "right" },
                    otherComponentInfo: { id: "comp-2", anchor: "left" },
                };
                const foreignLine: EditorComponentConnectionLine = {
                    id: "line-2",
                    draggedComponentInfo: { id: "comp-3", anchor: "right" },
                    otherComponentInfo: { id: "comp-4", anchor: "left" },
                };
                stubUseEditor({
                    components: [webServer, billingService],
                    connections: [connection],
                    componentConnectionLines: [ownLine, foreignLine],
                });
                renderEditorPage();

                fireEvent.dragEnd(getComponentRoot("Web Server"));

                expect(editor.removeInUseComponent).toHaveBeenCalledWith("comp-1");
                expect(editor.setShowHelpLines).toHaveBeenCalledWith(false);
                expect(editor.updateConnectionsOfComponent).toHaveBeenCalledWith("comp-1");
                expect(editor.deselectComponent).toHaveBeenCalledOnce();
                expect(editor.removeComponentConnectionLine).toHaveBeenCalledExactlyOnceWith("line-1");
                expect(editor.setConnectionVisibility).toHaveBeenCalledWith("conn-1", true);
            });

            it("restores the connections of a dragged connection target", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [connection] });
                renderEditorPage();

                fireEvent.dragEnd(getComponentRoot("Billing Service"));

                expect(editor.setConnectionVisibility).toHaveBeenCalledWith("conn-1", true);
            });

            it("draws a dashed preview for each drag line whose components exist", () => {
                stubUseEditor({
                    components: [webServer, billingService],
                    componentConnectionLines: [
                        {
                            id: "line-1",
                            draggedComponentInfo: { id: "comp-1", anchor: "right" },
                            otherComponentInfo: { id: "comp-2", anchor: "left" },
                        },
                        {
                            id: "line-2",
                            draggedComponentInfo: { id: "comp-1", anchor: "right" },
                            otherComponentInfo: { id: "comp-gone", anchor: "left" },
                        },
                    ],
                });
                renderEditorPage();

                expect(getPreviewLines()).toHaveLength(1);
            });
        });

        describe("points of attack on the canvas", () => {
            it("selects the clicked point of attack together with its component", () => {
                stubUseEditor({ components: [webServer] });
                const rectangle = createAnnotation({ id: "ann-1", type: "rect" });
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-1" },
                    systemState: { annotations: annotationsOf(rectangle) },
                });

                fireEvent.click(within(getComponentRoot("Web Server")).getByTestId("konva-arc"));

                expect(editor.setAssetSearchValue).toHaveBeenCalledWith("");
                expect(editor.selectPointOfAttack).toHaveBeenCalledWith("poa-1");
                expect(store.getState().editor.selectedAnnotation).toBeNull();
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(editor.selectComponent).toHaveBeenCalledWith("comp-1");
                expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
            });

            it("ignores the click while an annotation tool is active", () => {
                stubUseEditor({ components: [webServer] });
                renderEditorPage({ editorState: { annotationTool: "rect" } });

                fireEvent.click(within(getComponentRoot("Web Server")).getByTestId("konva-arc"));

                expect(editor.selectPointOfAttack).not.toHaveBeenCalled();
            });

            it("selects nothing on a non-primary button click", () => {
                stubUseEditor({ components: [webServer] });
                renderEditorPage();

                fireEvent.click(within(getComponentRoot("Web Server")).getByTestId("konva-arc"), { button: 1 });

                expect(editor.selectPointOfAttack).not.toHaveBeenCalled();
                expect(editor.selectComponent).not.toHaveBeenCalled();
            });
        });

        describe("anchors", () => {
            it("starts a connection from the clicked anchor", () => {
                stubUseEditor({ components: [webServer] });
                renderEditorPage();

                fireEvent.click(getAnchors("Web Server")[1]!);

                expect(editor.selectConnector).toHaveBeenCalledWith({
                    id: "comp-1",
                    anchor: AnchorOrientation.right,
                    type: STANDARD_COMPONENT_TYPES.SERVER,
                });
            });

            it("ignores a non-primary button click on an anchor", () => {
                stubUseEditor({ components: [webServer] });
                renderEditorPage();

                fireEvent.click(getAnchors("Web Server")[1]!, { button: 1 });

                expect(editor.selectConnector).not.toHaveBeenCalled();
            });

            it("ignores anchors while an annotation tool is active", () => {
                stubUseEditor({ components: [webServer] });
                renderEditorPage({ editorState: { annotationTool: "rect" } });

                fireEvent.click(getAnchors("Web Server")[1]!);

                expect(editor.selectConnector).not.toHaveBeenCalled();
            });
        });

        it("asks before deleting the component from the sidebar", async () => {
            const user = userEvent.setup();
            selectWebServer();
            renderEditorPage();

            await user.click(screen.getByRole("button", { name: "Delete component" }));

            expect(openConfirm.mock.lastCall![0]).toMatchObject({
                message: "Do you really want to delete the component 'Web Server'?",
            });
            acceptConfirm();
            expect(editor.removeComponent).toHaveBeenCalledOnce();
        });

        it("keeps the dragged component out of the sidebar", () => {
            selectWebServer({ isAnyComponentInUse: true });
            renderEditorPage();

            expect(screen.queryByText("Points of Attack")).not.toBeInTheDocument();
        });

        it("recalculates the connections of a component when its drag ends", () => {
            stubUseEditor({ components: [createCanvasComponent({ id: "comp-abc", name: "My Component" })] });

            renderEditorPage();
            fireEvent.dragEnd(getComponentRoot("My Component"));

            expect(editor.updateConnectionsOfComponent).toHaveBeenCalledWith("comp-abc");
        });
    });

    describe("connections", () => {
        describe("selecting and hovering", () => {
            const pointsOfAttack = [
                createPointOfAttack({ id: "poa-a", connectionId: "conn-1", componentId: null }),
                createPointOfAttack({ id: "poa-b", connectionId: "conn-1", componentId: null }),
                createPointOfAttack({ id: "poa-line", connectionId: "conn-1", componentId: null }),
            ];
            const drawnConnection = createAugmentedConnection({
                id: "conn-1",
                fromComponent: webServer,
                toComponent: billingService,
                waypoints: [150, 150, 350, 150],
                pointsOfAttack,
            });

            it("selects the clicked line and its communication-infrastructure point of attack", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [drawnConnection] });
                const rectangle = createAnnotation({ id: "ann-1", type: "rect" });
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-1" },
                    systemState: { annotations: annotationsOf(rectangle) },
                });

                fireEvent.click(getConnectionHitLines()[0]!);

                expect(editor.selectConnection).toHaveBeenCalledWith("conn-1");
                expect(editor.deselectComponent).toHaveBeenCalledOnce();
                expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(store.getState().editor.selectedAnnotation).toBeNull();
                expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
                // The line's own point of attack is selected without switching the component.
                expect(editor.selectPointOfAttack).toHaveBeenCalledWith("poa-line");
                expect(editor.selectComponent).not.toHaveBeenCalled();
            });

            it("ignores a non-primary button click on the line", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [drawnConnection] });
                renderEditorPage();

                fireEvent.click(getConnectionHitLines()[0]!, { button: 1 });

                expect(editor.selectConnection).not.toHaveBeenCalled();
                expect(editor.selectPointOfAttack).not.toHaveBeenCalled();
            });

            it("ignores a line click while an annotation tool is active", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [drawnConnection] });
                renderEditorPage({ editorState: { annotationTool: "rect" } });

                fireEvent.click(getConnectionHitLines()[0]!);

                expect(editor.selectConnection).not.toHaveBeenCalled();
            });

            it("highlights the connection while the pointer is over its line", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [drawnConnection] });
                renderEditorPage();
                expect(getConnectionVisibleLines()[0]).toHaveAttribute("data-stroke-width", "3");

                fireEvent.mouseOver(getConnectionHitLines()[0]!);
                expect(getConnectionVisibleLines()[0]).toHaveAttribute("data-stroke-width", "5");

                fireEvent.mouseOut(getConnectionHitLines()[0]!);
                expect(getConnectionVisibleLines()[0]).toHaveAttribute("data-stroke-width", "3");
            });

            it("highlights the connection while the pointer is over one of its edit handles", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [drawnConnection] });
                renderEditorPage();

                fireEvent.mouseEnter(getEditHandleSegments()[0]!);
                expect(getConnectionVisibleLines()[0]).toHaveAttribute("data-stroke-width", "5");

                fireEvent.mouseLeave(getEditHandleSegments()[0]!);
                expect(getConnectionVisibleLines()[0]).toHaveAttribute("data-stroke-width", "3");
            });

            it("keeps the highlight when the pointer leaves a different connection", () => {
                const otherConnection = createAugmentedConnection({
                    id: "conn-2",
                    fromComponent: billingService,
                    toComponent: webServer,
                    waypoints: [350, 250, 150, 250],
                });
                stubUseEditor({
                    components: [webServer, billingService],
                    connections: [drawnConnection, otherConnection],
                });
                renderEditorPage();

                fireEvent.mouseOver(getConnectionHitLines()[0]!);
                fireEvent.mouseOut(getConnectionHitLines()[1]!);

                expect(getConnectionVisibleLines()[0]).toHaveAttribute("data-stroke-width", "5");
            });
        });

        it("draws nothing for a hidden connection or one whose endpoint component is gone", () => {
            const hidden = {
                ...createAugmentedConnection({
                    id: "conn-hidden",
                    fromComponent: webServer,
                    toComponent: billingService,
                    waypoints: [150, 150, 350, 150],
                }),
                visible: false,
            };
            const dangling = createAugmentedConnection({
                id: "conn-dangling",
                fromComponent: webServer,
                toComponent: createCanvasComponent({ id: "comp-gone", name: "Gone" }),
                waypoints: [150, 150, 350, 150],
            });
            stubUseEditor({ components: [webServer, billingService], connections: [hidden, dangling] });

            renderEditorPage();

            expect(getConnectionHitLines()).toHaveLength(0);
            expect(getEditHandleSegments()).toHaveLength(0);
        });

        describe("edit handles", () => {
            const waypoints = [0, 0, 0, 40, 40, 40];
            const routedConnection = createAugmentedConnection({
                id: "conn-1",
                fromComponent: webServer,
                toComponent: billingService,
                waypoints,
            });

            it("selects the connection when a segment is clicked", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [routedConnection] });
                renderEditorPage();

                fireEvent.click(getEditHandleSegments()[0]!);

                expect(editor.selectConnection).toHaveBeenCalledWith("conn-1");
                expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
            });

            it("commits the new route when a segment is dragged", () => {
                stubUseEditor({ components: [webServer, billingService], connections: [routedConnection] });
                renderEditorPage();

                fireEvent.dragEnd(getEditHandleSegments()[0]!, { target: { x: () => 20, y: () => 0 } });

                // Segment 0 runs (0,0)-(0,40); its midpoint moved by (20, 0) lands at (20, 20).
                expect(editor.connectionEdited).toHaveBeenCalledWith(
                    "conn-1",
                    moveSegment(waypoints, 0, { x: 20, y: 20 })
                );
            });
        });

        describe("sidebar", () => {
            describe("text inputs", () => {
                const connection = createAugmentedConnection({
                    id: "conn-1",
                    fromComponent: webServer,
                    toComponent: billingService,
                });
                const uplink = createConnectionPoint({
                    id: "cp-1",
                    name: "eth0",
                    description: "Uplink",
                    componentId: "comp-1",
                    componentName: "Web Server",
                });

                const inputs = [
                    {
                        field: "component name",
                        select: () => selectWebServer(),
                        value: "Web Server",
                        action: () => editor.setSelectedComponentName,
                    },
                    {
                        field: "component description",
                        select: () =>
                            selectWebServer({ selectedComponent: { ...webServer, description: "Serves the shop" } }),
                        value: "Serves the shop",
                        action: () => editor.setSelectedComponentDescription,
                    },
                    {
                        field: "connection name",
                        select: () =>
                            stubUseEditor({
                                components: [webServer, billingService],
                                connections: [connection],
                                selectedConnection: connection,
                                selectedConnectionId: "conn-1",
                            }),
                        value: "Test Connection",
                        action: () => editor.setSelectedConnectionName,
                    },
                    {
                        field: "interface description",
                        select: () => stubUseEditor({ components: [webServer], selectedConnectionPoint: uplink }),
                        value: "Uplink",
                        action: () => editor.setSelectedConnectionPointDescription,
                    },
                ];

                it.each(inputs)("passes the typed $field to the editor", async ({ select, value, action }) => {
                    const user = userEvent.setup();
                    select();
                    renderEditorPage();

                    await user.type(screen.getByDisplayValue(value), "!");

                    expect(action()).toHaveBeenLastCalledWith(`${value}!`);
                });

                it.each(inputs)("ignores typing in the $field for a viewer", async ({ select, value, action }) => {
                    const user = userEvent.setup();
                    select();
                    renderEditorPage({ role: USER_ROLES.VIEWER });

                    await user.type(screen.getByDisplayValue(value), "!");

                    expect(action()).not.toHaveBeenCalled();
                });
            });

            describe("point of attack switches", () => {
                it("adds a point of attack when its switch is turned on", async () => {
                    const user = userEvent.setup();
                    selectWebServer();
                    renderEditorPage();

                    await user.click(screen.getByRole("switch", { name: "Data Storage Infrastructure" }));

                    expect(editor.addPointOfAttack).toHaveBeenCalledWith(
                        webServer,
                        POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE
                    );
                });

                it("asks before removing a point of attack when its switch is turned off", async () => {
                    const user = userEvent.setup();
                    selectWebServer();
                    renderEditorPage();

                    await user.click(screen.getByRole("switch", { name: "User Interface" }));

                    expect(openConfirm.mock.lastCall![0]).toMatchObject({
                        message: "Do you really want to delete the attack point 'User Interface'?",
                    });
                    acceptConfirm();
                    expect(editor.removePointOfAttack).toHaveBeenCalledWith(pointOfAttack);
                });

                it("changes nothing for a viewer", async () => {
                    const user = userEvent.setup();
                    selectWebServer();
                    renderEditorPage({ role: USER_ROLES.VIEWER });

                    await user.click(screen.getByRole("switch", { name: "Data Storage Infrastructure" }));
                    await user.click(screen.getByRole("switch", { name: "User Interface" }));

                    expect(editor.addPointOfAttack).not.toHaveBeenCalled();
                    expect(openConfirm).not.toHaveBeenCalled();
                });
            });

            describe("assets of a point of attack", () => {
                const customerData = createAsset({ id: 5, name: "Customer Data" });

                it("assigns an asset when its switch is turned on", async () => {
                    const user = userEvent.setup();
                    stubUseAssets([customerData]);
                    selectWebServer({ selectedPointOfAttack: { ...pointOfAttack, assets: [] } });
                    renderEditorPage();

                    await user.click(screen.getByRole("switch", { name: "Customer Data" }));

                    expect(editor.addAssetToSelectedPointOfAttack).toHaveBeenCalledWith(customerData);
                });

                it("unassigns an asset when its switch is turned off", async () => {
                    const user = userEvent.setup();
                    stubUseAssets([customerData]);
                    selectWebServer({ selectedPointOfAttack: { ...pointOfAttack, assets: [5] } });
                    renderEditorPage();

                    await user.click(screen.getByRole("switch", { name: "Customer Data" }));

                    expect(editor.removeAssetToSelectedPointOfAttack).toHaveBeenCalledWith(customerData);
                });

                it("changes nothing for a viewer", async () => {
                    const user = userEvent.setup();
                    stubUseAssets([customerData]);
                    selectWebServer({ selectedPointOfAttack: { ...pointOfAttack, assets: [] } });
                    renderEditorPage({ role: USER_ROLES.VIEWER });

                    await user.click(screen.getByRole("switch", { name: "Customer Data" }));

                    expect(editor.addAssetToSelectedPointOfAttack).not.toHaveBeenCalled();
                });
            });

            describe("assets of a component", () => {
                const customerData = createAsset({ id: 5, name: "Customer Data" });
                const dataStorage = createPointOfAttack({
                    id: "poa-2",
                    type: POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
                    componentId: "comp-1",
                });

                it.each([
                    ["Set All", () => editor.addAssetToPointOfAttack],
                    ["Unset All", () => editor.removeAssetFromPointOfAttack],
                ])("applies %s to every point of attack of the component", async (label, action) => {
                    const user = userEvent.setup();
                    stubUseAssets([customerData]);
                    selectWebServer({ pointsOfAttackOfSelectedComponent: [pointOfAttack, dataStorage] });
                    renderEditorPage();

                    await user.click(screen.getByRole("button", { name: label }));

                    expect(action()).toHaveBeenCalledTimes(2);
                    expect(action()).toHaveBeenCalledWith(customerData, pointOfAttack);
                    expect(action()).toHaveBeenCalledWith(customerData, dataStorage);
                });

                it("changes nothing for a viewer", async () => {
                    const user = userEvent.setup();
                    stubUseAssets([customerData]);
                    selectWebServer({ pointsOfAttackOfSelectedComponent: [pointOfAttack, dataStorage] });
                    renderEditorPage({ role: USER_ROLES.VIEWER });

                    await user.click(screen.getByRole("button", { name: "Set All" }));
                    await user.click(screen.getByRole("button", { name: "Unset All" }));

                    expect(editor.addAssetToPointOfAttack).not.toHaveBeenCalled();
                    expect(editor.removeAssetFromPointOfAttack).not.toHaveBeenCalled();
                });

                it("passes the asset search to the editor", async () => {
                    const user = userEvent.setup();
                    selectWebServer();
                    renderEditorPage();

                    await user.type(screen.getAllByRole("textbox", { name: "Search" })[0]!, "c");

                    expect(editor.setAssetSearchValue).toHaveBeenCalledWith("c");
                });
            });

            describe("interface breadcrumb", () => {
                it("returns from the interface to its component", async () => {
                    const user = userEvent.setup();
                    stubUseEditor({
                        components: [webServer],
                        selectedConnectionPoint: createConnectionPoint({
                            componentId: "comp-1",
                            componentName: "Web Server",
                        }),
                    });
                    renderEditorPage();

                    await user.click(screen.getByText("Web Server"));

                    expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                    expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
                    expect(editor.selectComponent).toHaveBeenCalledWith("comp-1");
                });

                it("does nothing for an interface without component", async () => {
                    const user = userEvent.setup();
                    stubUseEditor({
                        selectedConnectionPoint: createConnectionPoint({ componentId: null, componentName: "Orphan" }),
                    });
                    renderEditorPage();

                    await user.click(screen.getByText("Orphan"));

                    expect(editor.selectComponent).not.toHaveBeenCalled();
                    expect(editor.deselectConnectionPoint).not.toHaveBeenCalled();
                });
            });

            describe("component icon", () => {
                it("applies the icon chosen in the dialog and closes it", async () => {
                    const user = userEvent.setup();
                    selectWebServer();
                    renderEditorPage();

                    await user.click(screen.getByRole("button", { name: "Change icon" }));
                    const dialog = screen.getByRole("dialog");
                    expect(within(dialog).getByText("Change component icon")).toBeInTheDocument();
                    await user.click(within(dialog).getByRole("button", { name: "Database" }));
                    await user.click(within(dialog).getByRole("button", { name: "Save" }));

                    expect(editor.setSelectedComponentSymbol).toHaveBeenCalledWith(
                        STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.DATABASE]
                    );
                    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
                });

                it("closes the dialog on cancel without changing the icon", async () => {
                    const user = userEvent.setup();
                    selectWebServer();
                    renderEditorPage();

                    await user.click(screen.getByRole("button", { name: "Change icon" }));
                    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

                    expect(editor.setSelectedComponentSymbol).not.toHaveBeenCalled();
                    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
                });
            });

            const connection = createAugmentedConnection({
                id: "conn-1",
                fromComponent: webServer,
                toComponent: billingService,
            });

            it("resets a pinned route", async () => {
                const user = userEvent.setup();
                const pinned = { ...connection, pinned: true };
                stubUseEditor({
                    components: [webServer, billingService],
                    connections: [pinned],
                    selectedConnection: pinned,
                    selectedConnectionId: "conn-1",
                });
                renderEditorPage();

                await user.click(screen.getByRole("button", { name: "Reset routing" }));

                expect(editor.resetConnectionRouting).toHaveBeenCalledWith("conn-1");
            });

            it("asks before deleting the selected connection and closes the sidebar", async () => {
                const user = userEvent.setup();
                stubUseEditor({
                    components: [webServer, billingService],
                    connections: [connection],
                    selectedConnection: connection,
                    selectedConnectionId: "conn-1",
                });
                renderEditorPage();

                await user.click(within(getSidebar()).getByTestId("DeleteIcon").closest("button")!);

                expect(openConfirm.mock.lastCall![0]).toMatchObject({
                    message: "Do you really want to delete the connection 'Test Connection'?",
                });
                acceptConfirm();
                expect(editor.removeConnection).toHaveBeenCalledOnce();
                expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            });

            it("lists the source of an incoming connection and asks before deleting that connection", async () => {
                const user = userEvent.setup();
                stubUseEditor({
                    components: [webServer, billingService],
                    connections: [connection],
                    selectedComponent: billingService,
                    selectedComponentId: billingService.id,
                });
                renderEditorPage();

                const connectedEntry = screen.getByText("Web Server").parentElement!;
                await user.click(within(connectedEntry).getByRole("button"));

                acceptConfirm();
                expect(editor.removeConnectionById).toHaveBeenCalledWith("conn-1");
            });

            it("asks before deleting the connection to a connected component", async () => {
                const user = userEvent.setup();
                selectWebServer({ connections: [connection] });
                renderEditorPage();

                const connectedEntry = screen.getByText("Billing Service").parentElement!;
                await user.click(within(connectedEntry).getByRole("button"));

                expect(openConfirm.mock.lastCall![0]).toMatchObject({
                    message: "Do you really want to delete the connection 'Test Connection'?",
                });
                acceptConfirm();
                expect(editor.removeConnectionById).toHaveBeenCalledWith("conn-1");
            });
        });

        const connection = createAugmentedConnection({
            id: "conn-1",
            fromComponent: webServer,
            toComponent: billingService,
            waypoints: [0, 0, 100, 0, 100, 100],
        });

        it("shows segment and vertex edit handles on the selected connection", () => {
            stubUseEditor({
                components: [webServer, billingService],
                connections: [connection],
                selectedConnection: connection,
                selectedConnectionId: "conn-1",
            });

            renderEditorPage();

            expect(getEditHandleSegments()).toHaveLength(2);
            expect(getEditHandleVertices().map((vertex) => [vertex.dataset["x"], vertex.dataset["y"]])).toEqual([
                ["0", "0"],
                ["100", "0"],
                ["100", "100"],
            ]);
        });

        it("shows only the segment edit handles on an unselected connection", () => {
            stubUseEditor({ components: [webServer, billingService], connections: [connection] });

            renderEditorPage();

            expect(getEditHandleSegments()).toHaveLength(2);
            expect(getEditHandleVertices()).toHaveLength(0);
        });

        it("shows no edit handles to a viewer", () => {
            stubUseEditor({
                components: [webServer, billingService],
                connections: [connection],
                selectedConnection: connection,
                selectedConnectionId: "conn-1",
            });

            renderEditorPage({ role: USER_ROLES.VIEWER });

            expect(getEditHandleSegments()).toHaveLength(0);
            expect(getEditHandleVertices()).toHaveLength(0);
        });
    });

    describe("sidebar", () => {
        describe("point of attack label", () => {
            it("selects the point of attack and its component and opens the sidebar", async () => {
                const user = userEvent.setup();
                selectWebServer();
                renderEditorPage();

                await user.click(screen.getByRole("button", { name: "User Interface" }));

                expect(editor.setAssetSearchValue).toHaveBeenCalledWith("");
                expect(editor.selectPointOfAttack).toHaveBeenCalledWith("poa-1");
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(editor.selectComponent).toHaveBeenCalledWith("comp-1");
                expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
            });
        });

        describe("assets", () => {
            it("opens the asset dialog for a clicked asset name", async () => {
                const user = userEvent.setup();
                stubUseAssets([createAsset({ id: 5, name: "Customer Data" })]);
                selectWebServer();
                renderEditorPage();

                await user.click(screen.getByText("Customer Data"));

                expect(screen.getByTestId("asset-dialog-page")).toBeInTheDocument();
            });

            it("opens the asset dialog to create an asset", async () => {
                const user = userEvent.setup();
                selectWebServer();
                renderEditorPage();

                await user.click(screen.getByRole("button", { name: "Create Asset" }));

                expect(screen.getByTestId("asset-dialog-page")).toBeInTheDocument();
            });
        });

        describe("component breadcrumb", () => {
            it("leaves the point of attack for its component", async () => {
                const user = userEvent.setup();
                selectWebServer({ selectedPointOfAttack: pointOfAttack });
                renderEditorPage();

                await user.click(screen.getByText("Web Server"));

                expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
            });
        });

        describe("connected components", () => {
            const restApi = createCommunicationInterface({ id: "ci-1", name: "REST API", componentId: "comp-1" });
            const connectionToBilling = createAugmentedConnection({
                id: "conn-1",
                fromComponent: webServer,
                toComponent: billingService,
            });

            it("selects a communication interface of the component together with its point of attack", async () => {
                const user = userEvent.setup();
                const webServerWithInterface = { ...webServer, communicationInterfaces: [restApi] };
                selectWebServer({
                    components: [webServerWithInterface, billingService],
                    selectedComponent: webServerWithInterface,
                });
                renderEditorPage();

                await user.click(screen.getByText("REST API"));

                expect(editor.setAssetSearchValue).toHaveBeenCalledWith("");
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(editor.selectConnectionPoint).toHaveBeenCalledWith("ci-1");
                expect(editor.selectPointOfAttack).toHaveBeenCalledWith("ci-1");
                expect(editor.deselectComponent).toHaveBeenCalledOnce();
                expect(editor.selectComponent).not.toHaveBeenCalled();
                expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
            });

            it("selects a connected component", async () => {
                const user = userEvent.setup();
                selectWebServer({ connections: [connectionToBilling] });
                renderEditorPage();

                await user.click(screen.getByText("Billing Service"));

                expect(editor.setAssetSearchValue).toHaveBeenCalledWith("");
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
                expect(editor.selectComponent).toHaveBeenCalledWith("comp-2");
                expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(editor.selectConnectionPoint).not.toHaveBeenCalled();
                expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
            });

            it("treats a connection without communication interface (null) like a plain component link", async () => {
                const user = userEvent.setup();
                const nullInterfaceConnection = {
                    ...connectionToBilling,
                    to: { ...connectionToBilling.to, communicationInterfaceId: null },
                };
                selectWebServer({ connections: [nullInterfaceConnection] });
                renderEditorPage();

                await user.click(screen.getByText("Billing Service"));

                expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
                expect(editor.selectComponent).toHaveBeenCalledWith("comp-2");
                expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(editor.selectConnectionPoint).not.toHaveBeenCalled();
            });
        });
    });

    describe("annotations", () => {
        const lineAnnotation = createAnnotation({ id: "ann-line", type: "line", points: [0, 0, 100, 100] });
        const note = createAnnotation({ id: "ann-text", type: "text", text: "Note" });

        const getAnnotationLine = (): HTMLElement =>
            screen
                .getAllByTestId("konva-line")
                .find((line) => line.dataset["points"] === "[0,0,100,100]" && line.dataset["listening"] === "true")!;

        const getTextAnnotation = (text: string): HTMLElement =>
            screen
                .getAllByTestId("konva-text")
                .find((candidate) => candidate.dataset["text"] === text)!
                .closest<HTMLElement>('[data-testid="konva-group"]')!;

        const annotationsInStore = (store: { getState: () => RootState }): Annotation[] =>
            Object.values(store.getState().system.annotations.entities) as Annotation[];

        const drag = async (from: { x: number; y: number }, ...path: { x: number; y: number }[]) => {
            fireEvent.mouseDown(getStage(), { button: 0, clientX: from.x, clientY: from.y });
            for (const point of path) {
                fireEvent.mouseMove(getStage(), { clientX: point.x, clientY: point.y });
                await flushAnimationFrame();
            }
            const end = path.at(-1) ?? from;
            fireEvent.mouseUp(getStage(), { button: 0, clientX: end.x, clientY: end.y });
        };

        describe("drawing", () => {
            it("creates the drawn shape, drops the tool and selects nothing", async () => {
                const { store } = renderEditorPage({ editorState: { annotationTool: "rect" } });

                await drag({ x: 50, y: 40 }, { x: 150, y: 120 });

                expect(annotationsInStore(store)).toEqual([
                    expect.objectContaining({
                        type: "rect",
                        x: 50,
                        y: 40,
                        width: 100,
                        height: 80,
                        stroke: DEFAULT_ANNOTATION_COLOR,
                    }),
                ]);
                expect(store.getState().editor.annotationTool).toBeNull();
                expect(store.getState().editor.selectedAnnotation).toBeNull();
                expect(editor.deselectComponent).toHaveBeenCalledOnce();
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
                expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(editor.deselectConnector).toHaveBeenCalledOnce();
            });

            it("keeps the pencil active after a freehand stroke", async () => {
                const { store } = renderEditorPage({ editorState: { annotationTool: "freehand" } });

                await drag({ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 35 });

                expect(annotationsInStore(store)).toEqual([
                    expect.objectContaining({ type: "freehand", points: [10, 10, 20, 20, 30, 35] }),
                ]);
                expect(store.getState().editor.annotationTool).toBe("freehand");
            });

            it("places a text box that is selected and in edit mode", async () => {
                const { store } = renderEditorPage({ editorState: { annotationTool: "text" } });

                await drag({ x: 60, y: 70 });

                const [placed] = annotationsInStore(store);
                expect(placed).toMatchObject({ type: "text", x: 60, y: 70, width: 160, height: 40, text: "" });
                expect(store.getState().editor.selectedAnnotation).toBe(placed!.id);
                expect(store.getState().editor.annotationTool).toBeNull();
                expect(getTextToolbar()).toBeInTheDocument();
                expect(screen.getByRole("textbox")).not.toHaveAttribute("readonly");
            });

            it("uses the default color picked in the toolbar for new shapes", async () => {
                const user = userEvent.setup();
                const { store } = renderEditorPage({ editorState: { annotationTool: "rect" } });

                await user.click(screen.getByRole("button", { name: "#e74c3c" }));
                await drag({ x: 50, y: 40 }, { x: 150, y: 120 });

                expect(store.getState().system.defaultAnnotationColorByProject[1]).toBe("#e74c3c");
                expect(annotationsInStore(store)[0]).toMatchObject({ stroke: "#e74c3c" });
            });

            it("cancels the drawing, its preview and the tool on Escape", async () => {
                const user = userEvent.setup();
                const { store } = renderEditorPage({ editorState: { annotationTool: "rect" } });
                fireEvent.mouseDown(getStage(), { button: 0, clientX: 50, clientY: 40 });
                fireEvent.mouseMove(getStage(), { clientX: 150, clientY: 120 });
                await flushAnimationFrame();
                const isPreview = (rect: HTMLElement) => rect.dataset["dash"] === "[6,4]";
                expect(screen.getAllByTestId("konva-rect").filter(isPreview)).toHaveLength(1);

                await user.keyboard("{Escape}");
                fireEvent.mouseUp(getStage(), { button: 0, clientX: 150, clientY: 120 });

                expect(screen.queryAllByTestId("konva-rect").filter(isPreview)).toHaveLength(0);
                expect(store.getState().editor.annotationTool).toBeNull();
                expect(annotationsInStore(store)).toEqual([]);
            });

            it("does not start a new drawing while a text is being edited", () => {
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-text", annotationTool: "rect" },
                    systemState: { annotations: annotationsOf(note) },
                });
                fireEvent.doubleClick(getTextAnnotation("Note"));

                fireEvent.mouseDown(getStage(), { button: 0, clientX: 50, clientY: 40 });
                fireEvent.mouseUp(getStage(), { button: 0, clientX: 50, clientY: 40 });

                expect(store.getState().system.annotations.ids).toEqual(["ann-text"]);
            });

            it("does not draw for a viewer", async () => {
                const { store } = renderEditorPage({
                    role: USER_ROLES.VIEWER,
                    editorState: { annotationTool: "rect" },
                });

                await drag({ x: 50, y: 40 }, { x: 150, y: 120 });

                expect(annotationsInStore(store)).toEqual([]);
            });
        });

        describe("leaving text edit mode", () => {
            const placeText = async () => {
                const result = renderEditorPage({ editorState: { annotationTool: "text" } });
                await drag({ x: 60, y: 70 });
                // The text area takes focus one frame after edit mode starts.
                await flushAnimationFrame();
                return result;
            };

            it("discards a text that was never typed in on Escape", async () => {
                const user = userEvent.setup();
                const { store } = await placeText();

                await user.keyboard("{Escape}");

                expect(annotationsInStore(store)).toEqual([]);
            });

            it("keeps a typed text on Escape", async () => {
                const user = userEvent.setup();
                const { store } = await placeText();

                await user.type(screen.getByRole("textbox"), "Hello");
                await user.keyboard("{Escape}");

                expect(annotationsInStore(store)).toEqual([expect.objectContaining({ type: "text", text: "Hello" })]);
            });

            it("discards an empty text when another element gets selected", async () => {
                stubUseEditor({ components: [webServer] });
                const { store } = await placeText();

                fireEvent.click(getComponentIcon("Web Server"));

                expect(annotationsInStore(store)).toEqual([]);
            });

            it("discards an empty text on a click on the empty stage", async () => {
                const { store } = await placeText();

                fireEvent.mouseDown(getStage(), { button: 0 });

                expect(annotationsInStore(store)).toEqual([]);
            });

            it("ignores an exit request from a text that is not being edited", () => {
                const emptyText = createAnnotation({ id: "ann-empty", type: "text", text: "" });
                const { store } = renderEditorPage({ systemState: { annotations: annotationsOf(emptyText) } });

                fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });

                expect(store.getState().system.annotations.ids).toEqual(["ann-empty"]);
            });
        });

        describe("selecting", () => {
            it("selects a clicked shape, clears the other selections and opens the sidebar", () => {
                const { store } = renderEditorPage({ systemState: { annotations: annotationsOf(lineAnnotation) } });

                fireEvent.click(getAnnotationLine());

                expect(store.getState().editor.selectedAnnotation).toBe("ann-line");
                expect(editor.deselectComponent).toHaveBeenCalledOnce();
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(editor.deselectPointOfAttack).toHaveBeenCalledOnce();
                expect(editor.deselectConnectionPoint).toHaveBeenCalledOnce();
                expect(editor.deselectConnector).toHaveBeenCalledOnce();
                expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
            });

            it("keeps the sidebar closed for a clicked text", () => {
                const { store } = renderEditorPage({ systemState: { annotations: annotationsOf(note) } });

                fireEvent.click(getTextAnnotation("Note"));

                expect(store.getState().editor.selectedAnnotation).toBe("ann-text");
                expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            });

            it("selects a dragged shape without opening the sidebar and stores its new position", () => {
                const { store } = renderEditorPage({ systemState: { annotations: annotationsOf(lineAnnotation) } });

                fireEvent.dragEnd(getAnnotationLine(), { target: { x: () => 30, y: () => 40 } });

                expect(store.getState().editor.selectedAnnotation).toBe("ann-line");
                expect(store.getState().system.annotations.entities["ann-line"]).toMatchObject({ x: 30, y: 40 });
                expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            });

            it("hides the text toolbar while the text is dragged", () => {
                renderEditorPage({
                    editorState: { selectedAnnotation: "ann-text" },
                    systemState: { annotations: annotationsOf(note) },
                });
                expect(getTextToolbar()).toBeVisible();

                fireEvent.dragStart(getTextAnnotation("Note"));
                expect(getTextToolbar()).not.toBeVisible();

                fireEvent.dragEnd(getTextAnnotation("Note"));
                expect(getTextToolbar()).toBeVisible();
            });
        });

        describe("tool selection", () => {
            it("clears every selection and closes the sidebar when a tool is picked", async () => {
                const user = userEvent.setup();
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-line" },
                    systemState: { annotations: annotationsOf(lineAnnotation) },
                });

                await user.click(screen.getByRole("button", { name: "Pencil" }));

                expect(store.getState().editor.annotationTool).toBe("freehand");
                expect(store.getState().editor.selectedAnnotation).toBeNull();
                expect(editor.deselectComponent).toHaveBeenCalledOnce();
                expect(editor.deselectConnection).toHaveBeenCalledOnce();
                expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            });

            it("only closes an open communication menu before picking the tool", async () => {
                const user = userEvent.setup();
                stubUseEditor({ components: [webServer] });
                const { store } = renderEditorPage();
                await user.click(getPlugIcon("Web Server"));

                await user.click(screen.getByRole("button", { name: "Pencil" }));

                expect(screen.getByText("Web Server: Communication Interface")).not.toBeVisible();
                expect(editor.deselectComponent).not.toHaveBeenCalled();
                expect(store.getState().editor.annotationTool).toBe("freehand");
            });

            it("deselects nothing when the tool is turned off", async () => {
                const user = userEvent.setup();
                const { store } = renderEditorPage({ editorState: { annotationTool: "freehand" } });

                await user.click(screen.getByRole("button", { name: "Pencil" }));

                expect(store.getState().editor.annotationTool).toBeNull();
                expect(editor.deselectComponent).not.toHaveBeenCalled();
            });

            it("shows no active tool while another project's system is still loaded", () => {
                renderEditorPage({ loadedProjectId: 2, editorState: { annotationTool: "freehand" } });

                expect(screen.getByRole("button", { name: "Pencil" })).toHaveAttribute("aria-pressed", "false");
            });

            it("shows the active tool of the loaded project", () => {
                renderEditorPage({ editorState: { annotationTool: "freehand" } });

                expect(screen.getByRole("button", { name: "Pencil" })).toHaveAttribute("aria-pressed", "true");
            });
        });

        describe("styling the selected annotation", () => {
            it("recolors the selected annotation from the sidebar", async () => {
                const user = userEvent.setup();
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-line" },
                    systemState: { annotations: annotationsOf(lineAnnotation) },
                });

                await user.click(within(getSidebar()).getByRole("button", { name: "#e74c3c" }));

                expect(store.getState().system.annotations.entities["ann-line"]).toMatchObject({ stroke: "#e74c3c" });
            });

            it("previews a custom color on the canvas without storing it until it is committed", async () => {
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-line" },
                    systemState: { annotations: annotationsOf(lineAnnotation) },
                });
                const colorInput = getSidebar().querySelector<HTMLInputElement>('input[type="color"]')!;

                fireEvent.input(colorInput, { target: { value: "#123456" } });
                await flushAnimationFrame();

                expect(getAnnotationLine()).toHaveAttribute("data-stroke", "#123456");
                expect(store.getState().system.annotations.entities["ann-line"]).toMatchObject({
                    stroke: DEFAULT_ANNOTATION_COLOR,
                });

                fireEvent.change(colorInput, { target: { value: "#123456" } });

                expect(store.getState().system.annotations.entities["ann-line"]).toMatchObject({ stroke: "#123456" });
            });

            it("recolors and formats a text from its toolbar", async () => {
                const user = userEvent.setup();
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-text" },
                    systemState: { annotations: annotationsOf(note) },
                });

                await user.click(within(getTextToolbar()).getByRole("button", { name: "#e74c3c" }));
                await user.click(within(getTextToolbar()).getByRole("button", { name: "Bold" }));

                expect(store.getState().system.annotations.entities["ann-text"]).toMatchObject({
                    stroke: "#e74c3c",
                    bold: true,
                });
            });
        });

        describe("deleting", () => {
            it("removes the text from its toolbar and closes the sidebar", async () => {
                const user = userEvent.setup();
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-text" },
                    systemState: { annotations: annotationsOf(note) },
                });

                await user.click(within(getTextToolbar()).getByRole("button", { name: "Delete annotation" }));

                expect(store.getState().system.annotations.ids).toEqual([]);
                expect(store.getState().editor.selectedAnnotation).toBeNull();
                expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            });

            it("removes the shape from the sidebar and closes the sidebar", async () => {
                const user = userEvent.setup();
                const { store } = renderEditorPage({
                    editorState: { selectedAnnotation: "ann-line" },
                    systemState: { annotations: annotationsOf(lineAnnotation) },
                });

                await user.click(within(getSidebar()).getByRole("button", { name: "Delete annotation" }));

                expect(store.getState().system.annotations.ids).toEqual([]);
                expect(store.getState().editor.selectedAnnotation).toBeNull();
                expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            });
        });
    });

    describe("communication interfaces", () => {
        const restApi = createCommunicationInterface({ id: "ci-1", name: "REST API", componentId: "comp-1" });
        const webServerWithInterface = createCanvasComponent({
            ...webServer,
            communicationInterfaces: [restApi],
        });
        const menuTitle = "Web Server: Communication Interface";

        const openMenu = async (user: ReturnType<typeof userEvent.setup>) => {
            await user.click(getPlugIcon("Web Server"));
        };

        it("toggles the menu with the component's plug icon", async () => {
            const user = userEvent.setup();
            stubUseEditor({ components: [webServerWithInterface] });
            renderEditorPage();
            expect(screen.getByText(/: Communication Interface$/)).not.toBeVisible();

            await openMenu(user);
            expect(screen.getByText(menuTitle)).toBeVisible();

            await openMenu(user);
            expect(screen.getByText(menuTitle)).not.toBeVisible();
        });

        it("toggles the menu from the communication-interfaces ring segment", () => {
            const interfacesRingSegment = createPointOfAttack({
                id: "poa-interfaces",
                type: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
                componentId: "comp-1",
            });
            stubUseEditor({
                components: [createCanvasComponent({ ...webServer, pointsOfAttack: [interfacesRingSegment] })],
            });
            renderEditorPage();

            fireEvent.click(within(getComponentRoot("Web Server")).getByTestId("konva-arc"));

            expect(screen.getByText(menuTitle)).toBeVisible();
        });

        it("offers no plug icon on a users component", () => {
            stubUseEditor({
                components: [
                    createCanvasComponent({ id: "comp-users", name: "Staff", type: STANDARD_COMPONENT_TYPES.USERS }),
                ],
            });
            renderEditorPage();

            const circleRadii = within(getComponentRoot("Staff"))
                .getAllByTestId("konva-circle")
                .map((circle) => circle.dataset["radius"]);
            expect(circleRadii).not.toContain("12");
        });

        it("does not open while an annotation tool is active", async () => {
            const user = userEvent.setup();
            stubUseEditor({ components: [webServerWithInterface] });
            renderEditorPage({ editorState: { annotationTool: "rect" } });

            await openMenu(user);

            expect(screen.queryByText(menuTitle)).not.toBeInTheDocument();
        });

        it("selects a listed interface with its point of attack, opens the sidebar and closes the menu", async () => {
            const user = userEvent.setup();
            stubUseEditor({ components: [webServerWithInterface] });
            const rectangle = createAnnotation({ id: "ann-1", type: "rect" });
            const { store } = renderEditorPage({
                editorState: { selectedAnnotation: "ann-1" },
                systemState: { annotations: annotationsOf(rectangle) },
            });
            await openMenu(user);

            await user.click(screen.getByTestId("communication-list-item"));

            expect(editor.selectConnectionPoint).toHaveBeenCalledWith("ci-1");
            expect(editor.deselectComponent).toHaveBeenCalledOnce();
            expect(editor.deselectConnection).toHaveBeenCalledOnce();
            expect(store.getState().editor.selectedAnnotation).toBeNull();
            expect(editor.setAssetSearchValue).toHaveBeenCalledWith("");
            expect(editor.selectPointOfAttack).toHaveBeenCalledWith("ci-1");
            expect(getSidebar().style.right).toBe(SIDEBAR_OPEN);
            expect(screen.getByText(menuTitle)).not.toBeVisible();
        });

        it("reports an interface that the opened component does not know", async () => {
            const user = userEvent.setup();
            stubUseEditor({ components: [webServerWithInterface] });
            const { rerenderPage } = renderEditorPage();
            await openMenu(user);
            const addedLater = createCommunicationInterface({ id: "ci-2", name: "gRPC", componentId: "comp-1" });
            stubUseEditor({
                ...editor,
                components: [createCanvasComponent({ ...webServer, communicationInterfaces: [restApi, addedLater] })],
            });
            rerenderPage();

            await user.click(screen.getByText("gRPC"));

            expect(showErrorMessage).toHaveBeenCalledWith({
                message: "The selected communication interface was not found for this component.",
            });
            expect(editor.selectConnectionPoint).not.toHaveBeenCalled();
        });

        it("starts a connection from an unconnected interface", async () => {
            const user = userEvent.setup();
            stubUseEditor({ components: [webServerWithInterface] });
            renderEditorPage();
            await openMenu(user);

            await user.click(screen.getByTestId("WifiTetheringIcon").closest("button")!);

            expect(editor.selectConnector).toHaveBeenCalledWith({
                id: "comp-1",
                anchor: AnchorOrientation.center,
                type: STANDARD_COMPONENT_TYPES.SERVER,
                name: "REST API",
                communicationInterfaceId: "ci-1",
            });
        });

        it("asks before removing the connection of a connected interface", async () => {
            const user = userEvent.setup();
            const connection = createAugmentedConnection({
                id: "conn-1",
                fromComponent: webServerWithInterface,
                toComponent: billingService,
            });
            const interfaceConnection = {
                ...connection,
                from: { ...connection.from, communicationInterfaceId: "ci-1" },
            };
            stubUseEditor({ components: [webServerWithInterface, billingService], connections: [interfaceConnection] });
            renderEditorPage();
            await openMenu(user);

            await user.click(screen.getByTestId("WifiTetheringOffIcon").closest("button")!);

            expect(editor.selectConnector).not.toHaveBeenCalled();
            expect(openConfirm.mock.lastCall![0]).toMatchObject({
                message: "Do you really want to delete the connection 'Test Connection'?",
            });
            acceptConfirm();
            expect(editor.removeConnectionById).toHaveBeenCalledWith("conn-1");
        });

        describe("creating an interface", () => {
            it("adds the interface entered in the dialog to the component and closes the dialog", async () => {
                const user = userEvent.setup();
                stubUseEditor({ components: [webServerWithInterface] });
                renderEditorPage();
                await openMenu(user);

                await user.click(screen.getByTestId("create-communication-button"));
                const dialog = screen.getByRole("dialog");
                expect(within(dialog).getByText("Create New Communication Interface")).toBeInTheDocument();
                await user.type(within(dialog).getByRole("textbox"), "WLAN");
                await user.click(within(dialog).getByRole("button", { name: "Save" }));

                await waitFor(() =>
                    expect(editor.addCommunicationInterface).toHaveBeenCalledWith("comp-1", "WLAN", "DeviceHub")
                );
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            });

            it("closes the dialog on cancel without adding anything", async () => {
                const user = userEvent.setup();
                stubUseEditor({ components: [webServerWithInterface] });
                renderEditorPage();
                await openMenu(user);

                await user.click(screen.getByTestId("create-communication-button"));
                await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));

                expect(editor.addCommunicationInterface).not.toHaveBeenCalled();
                expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
            });
        });

        describe("in the sidebar", () => {
            const eth0 = createConnectionPoint({
                id: "cp-1",
                name: "eth0",
                componentId: "comp-1",
                componentName: "Web Server",
            });

            it("renames the selected interface", async () => {
                const user = userEvent.setup();
                stubUseEditor({ components: [webServer], selectedConnectionPoint: eth0 });
                renderEditorPage();

                await user.type(screen.getByDisplayValue("eth0"), "!");

                expect(editor.handleChangeCommunicationInterfaceName).toHaveBeenLastCalledWith(
                    "comp-1",
                    "cp-1",
                    "eth0!"
                );
            });

            it("renames an interface listed on its component", async () => {
                const user = userEvent.setup();
                selectWebServer({ components: [webServerWithInterface], selectedComponent: webServerWithInterface });
                renderEditorPage();
                const interfaceRow = screen.getByText("REST API").parentElement!;

                await user.click(within(interfaceRow).getByTestId("EditIcon").closest("button")!);
                await user.type(screen.getByDisplayValue("REST API"), "!");

                expect(editor.handleChangeCommunicationInterfaceName).toHaveBeenLastCalledWith(
                    "comp-1",
                    "ci-1",
                    "REST API!"
                );
            });

            it("asks before deleting the selected interface and closes the sidebar", async () => {
                const user = userEvent.setup();
                stubUseEditor({ components: [webServer], selectedConnectionPoint: eth0 });
                renderEditorPage();

                await user.click(within(getSidebar()).getByTestId("DeleteIcon").closest("button")!);

                expect(openConfirm.mock.lastCall![0]).toMatchObject({
                    message: "Do you really want to delete the communication interface 'eth0'?",
                });
                acceptConfirm();
                expect(editor.handleDeleteCommunicationInterface).toHaveBeenCalledWith("comp-1", "cp-1");
                expect(getSidebar().style.right).toBe(SIDEBAR_CLOSED);
            });

            it("asks before deleting an interface listed on its component and keeps the sidebar open", async () => {
                const user = userEvent.setup();
                selectWebServer({ components: [webServerWithInterface], selectedComponent: webServerWithInterface });
                renderEditorPage();
                const interfaceRow = screen.getByText("REST API").parentElement!;

                await user.click(within(interfaceRow).getByTestId("DeleteIcon").closest("button")!);

                expect(openConfirm.mock.lastCall![0]).toMatchObject({
                    message: "Do you really want to delete the communication interface 'REST API'?",
                });
                acceptConfirm();
                expect(editor.handleDeleteCommunicationInterface).toHaveBeenCalledWith("comp-1", "ci-1");
                expect(getSidebar().style.right).not.toBe(SIDEBAR_CLOSED);
            });
        });
    });

    describe("toolbar", () => {
        describe("center editor", () => {
            beforeEach(() => {
                konvaTestControls.setStageSize({ width: 1000, height: 800 });
            });

            it("fits the layer's content into the viewport with 5 % padding", async () => {
                const user = userEvent.setup();
                konvaTestControls.setLayerClientRect({ x: 100, y: 50, width: 400, height: 200 });
                renderEditorPage();

                await user.click(screen.getByRole("button", { name: "Center editor" }));

                // Padded box 440 × 220 → scale min(1000 / 440, 800 / 220); its center (300, 150)
                // lands on the viewport center (500, 400).
                const fitScale = 1000 / 440;
                const [layerX, layerY] = vi.mocked(editor.setLayerPosition).mock.lastCall!;
                expect(layerX).toBeCloseTo(500 / fitScale - 300);
                expect(layerY).toBeCloseTo(400 / fitScale - 150);
                const [scale, position] = vi.mocked(editor.setStageScale).mock.lastCall!;
                expect(scale).toBeCloseTo(fitScale);
                expect(position).toEqual({ x: 0, y: 0 });
                expect(konvaTestControls.getMountedStage()!.scaleX()).toBeCloseTo(fitScale);
            });

            it.each([
                ["a tiny", { x: 0, y: 0, width: 1, height: 1 }, MAX_STAGE_SCALE],
                ["a huge", { x: 0, y: 0, width: 100_000, height: 100_000 }, MIN_STAGE_SCALE],
            ])("keeps the zoom within its bounds for %s drawing", async (_size, rect, expectedScale) => {
                const user = userEvent.setup();
                konvaTestControls.setLayerClientRect(rect);
                renderEditorPage();

                await user.click(screen.getByRole("button", { name: "Center editor" }));

                expect(vi.mocked(editor.setStageScale).mock.lastCall![0]).toBe(expectedScale);
            });

            it("resets position and zoom for an empty canvas", async () => {
                const user = userEvent.setup();
                renderEditorPage();

                await user.click(screen.getByRole("button", { name: "Center editor" }));

                expect(editor.setLayerPosition).toHaveBeenCalledWith(0, 0);
                expect(editor.setStageScale).toHaveBeenCalledWith(1, { x: 0, y: 0 });
            });
        });

        describe("fit to view on first load", () => {
            beforeEach(() => {
                konvaTestControls.setStageSize({ width: 1000, height: 800 });
                konvaTestControls.setLayerClientRect({ x: 100, y: 50, width: 400, height: 200 });
            });

            it("centers a freshly loaded project once and remembers it", async () => {
                const { store } = renderEditorPage({ editorState: { lastCenteredProjectId: null } });

                await flushAnimationFrame();

                expect(editor.setLayerPosition).toHaveBeenCalledOnce();
                expect(editor.setStageScale).toHaveBeenCalledOnce();
                expect(store.getState().editor.lastCenteredProjectId).toBe(1);
            });

            it("clears the navigation state it arrived with", async () => {
                renderEditorPage({
                    initialEntries: [{ pathname: "/projects/1/system", state: { from: "projects" } }],
                    editorState: { lastCenteredProjectId: null },
                });
                expect(screen.getByTestId("location-state")).toHaveTextContent('{"from":"projects"}');

                await flushAnimationFrame();

                expect(screen.getByTestId("location-state")).toHaveTextContent("{}");
            });

            it("keeps the user's view of an already centered project", async () => {
                renderEditorPage({ editorState: { lastCenteredProjectId: 1 } });

                await flushAnimationFrame();

                expect(editor.setLayerPosition).not.toHaveBeenCalled();
            });

            it("waits until the project's own system is loaded", async () => {
                const { store } = renderEditorPage({
                    loadedProjectId: 2,
                    editorState: { lastCenteredProjectId: null },
                });

                await flushAnimationFrame();

                expect(editor.setLayerPosition).not.toHaveBeenCalled();
                expect(store.getState().editor.lastCenteredProjectId).toBeNull();
            });

            it("does not center after the page unmounted", async () => {
                const { store, unmount } = renderEditorPage({ editorState: { lastCenteredProjectId: null } });

                unmount();
                await flushAnimationFrame();

                expect(editor.setLayerPosition).not.toHaveBeenCalled();
                expect(store.getState().editor.lastCenteredProjectId).toBeNull();
            });
        });

        describe("export system image", () => {
            const clickExport = async () => {
                const user = userEvent.setup();
                await user.click(screen.getByRole("button", { name: "Export System Image" }));
            };

            it("downloads the canvas as systemView.png", async () => {
                const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
                konvaTestControls.setLayerClientRect({ x: 0, y: 0, width: 400, height: 200 });
                konvaTestControls.setLayerDataUrl("data:image/png;base64,AAAA");
                renderEditorPage();

                await clickExport();

                await waitFor(() => expect(click).toHaveBeenCalledOnce());
                const link = click.mock.contexts[0] as HTMLAnchorElement;
                expect(link.download).toBe("systemView.png");
                expect(link.href).toBe("data:image/png;base64,AAAA");
            });

            it.each([
                ["an empty canvas", { x: 0, y: 0, width: 0, height: 0 }, "data:image/png;base64,AAAA"],
                ["a blank image", { x: 0, y: 0, width: 400, height: 200 }, "data:,"],
            ])("downloads nothing for %s", async (_case, rect, dataUrl) => {
                const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
                konvaTestControls.setLayerClientRect(rect);
                konvaTestControls.setLayerDataUrl(dataUrl);
                renderEditorPage();

                await clickExport();
                await flushAnimationFrame();

                expect(click).not.toHaveBeenCalled();
            });

            it("logs a failed export", async () => {
                const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
                const exportError = new Error("tainted canvas");
                konvaTestControls.setLayerClientRect({ x: 0, y: 0, width: 400, height: 200 });
                konvaTestControls.setLayerDataUrlError(exportError);
                renderEditorPage();

                await clickExport();

                await waitFor(() =>
                    expect(consoleError).toHaveBeenCalledWith("Failed to export system view", exportError)
                );
            });
        });

        it("shifts the grid by the stage offset", () => {
            const { rerenderPage } = renderEditorPage({
                editorState: { stagePosition: { x: 40, y: 20 }, stageScale: 2 },
            });
            const firstHorizontalLine = () => screen.getAllByTestId("konva-line")[0]!;
            const firstVerticalLine = () => screen.getAllByTestId("konva-line")[400]!;
            expect(firstHorizontalLine()).toHaveAttribute("data-points", JSON.stringify([-1500, -1500, 500000, -1500]));

            // The grid reads the stage once it is mounted; the offset is position / scale = (20, 10).
            rerenderPage();

            expect(firstHorizontalLine()).toHaveAttribute("data-points", JSON.stringify([-1520, -1510, 500000, -1510]));
            expect(firstVerticalLine()).toHaveAttribute("data-points", JSON.stringify([-1520, -1510, -1520, 500000]));
        });
    });

    describe("routing", () => {
        it("renders the asset dialog at assets/:assetId/edit", () => {
            renderEditorPage({ initialEntries: ["/projects/1/system/assets/5/edit"] });

            expect(screen.getByTestId("asset-dialog-page")).toBeInTheDocument();
        });

        it("renders the component dialog at components/edit", () => {
            renderEditorPage({ initialEntries: ["/projects/1/system/components/edit"] });

            expect(screen.getByTestId("component-dialog-page")).toBeInTheDocument();
        });
    });

    describe("force-save on unmount", () => {
        it("saves when the route's project is the one loaded in the store", () => {
            const { unmount } = renderEditorPage({ loadedProjectId: 1 });

            unmount();

            expect(editor.saveCurrentSystem).toHaveBeenCalledOnce();
        });

        it("does not save while another project's system is still in the store", () => {
            const { unmount } = renderEditorPage({ loadedProjectId: 2 });

            unmount();

            expect(editor.saveCurrentSystem).not.toHaveBeenCalled();
        });

        it("does not save before any system has been loaded", () => {
            const { unmount } = renderEditorPage({ loadedProjectId: null });

            unmount();

            expect(editor.saveCurrentSystem).not.toHaveBeenCalled();
        });
    });
});
