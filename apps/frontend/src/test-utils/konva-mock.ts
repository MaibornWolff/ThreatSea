/**
 * @module konva-mock - Shared `react-konva` mock applied globally via `vitest.setup.ts`.
 *
 * react-konva renders into a real `<canvas>` and requires a `<Stage>` ancestor at runtime,
 * neither of which work under jsdom. Every test in this codebase wants the same stub:
 * shape components render as plain `<div>`s carrying their interesting props as
 * `data-*` attributes so tests can assert on geometry/stroke/etc.
 *
 * Event handlers are mapped onto DOM events (`onDragMove` → `drag`, `onDblClick` → `dblclick`, …)
 * and receive a Konva-shaped event `{ evt, target, currentTarget, cancelBubble }`: `evt` is the
 * native DOM event, `target` the DOM element the event was fired on, extended with Konva node
 * defaults (`getStage`, `getLayer`, `x`, `y`, `position`, `setPosition`, `stopDrag`, `startDrag`).
 * Properties set via `fireEvent.drag(element, { target: stub })` win over those defaults.
 * Setting `event.cancelBubble = true` in a handler stops the DOM event from bubbling further,
 * like Konva does.
 *
 * `<Stage>` exposes a stateful fake stage through its `ref` (position, scale, size, pointer,
 * `content` = the `konva-stage` div) and registers it as the stage returned by `getStage()`.
 * `<Layer>` exposes a fake layer through its `ref` (`getClientRect`, `find`, `toDataURL`).
 * `konvaTestControls` sets what jsdom cannot measure (stage size, pointer, layer bounds, exported
 * image or export error) and is reset after every test in `vitest.setup.ts`. See `TESTING.md` §2.1 "Canvas (react-konva) in component tests".
 *
 * Wired once in `vitest.setup.ts` so individual test files don't need their own
 * `vi.mock("react-konva", ...)` block — a per-file mock would collide with this one
 * under `isolate: false`.
 *
 * Uses `React.createElement` instead of JSX so the file stays a plain `.ts` module —
 * keeps `vitest.setup.ts` JSX-free and side-steps tsconfig friction for non-`src` files.
 */
import {
    createElement,
    useImperativeHandle,
    useLayoutEffect,
    useState,
    type ReactNode,
    type Ref,
    type SyntheticEvent,
} from "react";

type AnyProps = Record<string, unknown>;
type KonvaHandler = (event: KonvaTestEvent) => void;

interface Point {
    x: number;
    y: number;
}

export interface KonvaTestEvent {
    evt: Event;
    target: Record<string, unknown>;
    currentTarget: Record<string, unknown>;
    cancelBubble: boolean;
}

const stub = (testid: string, dataProps: Record<string, string> = {}, children?: ReactNode) =>
    createElement("div", { "data-testid": testid, ...dataProps }, children);

const str = (value: unknown): string => (value === undefined ? "undefined" : String(value));
const json = (value: unknown): string => JSON.stringify(value);

interface Size {
    width: number;
    height: number;
}

export interface FakeStage {
    nodeType: "Stage";
    /** Real element (the `konva-stage` div) so `content.style.cursor` is observable. */
    content: HTMLElement | null;
    x: () => number;
    y: () => number;
    position: (point?: Point) => Point;
    scale: (scale?: Point) => Point;
    scaleX: () => number;
    scaleY: () => number;
    width: (value?: number) => number;
    height: (value?: number) => number;
    getPointerPosition: () => Point | null;
    getRelativePointerPosition: () => Point | null;
    batchDraw: () => void;
    getStage: () => FakeStage;
}

interface ClientRect extends Point, Size {}

export interface FakeLayer {
    getClientRect: (config?: unknown) => ClientRect;
    find: (selector: string) => unknown[];
    toDataURL: (config?: unknown) => string;
    batchDraw: () => void;
}

// What an empty canvas exports.
const EMPTY_DATA_URL = "data:,";

const createDefaultControls = () => ({
    stageSize: null as Size | null,
    pointerOverride: null as Point | null,
    lastPointer: null as Point | null,
    layerClientRect: { x: 0, y: 0, width: 0, height: 0 } as ClientRect,
    layerDataUrl: EMPTY_DATA_URL,
    layerDataUrlError: null as unknown,
});

const controls = createDefaultControls();

let mountedStage: FakeStage | null = null;

const createFakeStage = (): FakeStage => {
    let position: Point = { x: 0, y: 0 };
    let scale: Point = { x: 1, y: 1 };
    const size: Size = { width: 0, height: 0 };
    const stage: FakeStage = {
        nodeType: "Stage",
        content: null,
        x: () => position.x,
        y: () => position.y,
        position: (point) => {
            if (point) {
                position = { x: point.x, y: point.y };
            }
            return position;
        },
        scale: (newScale) => {
            if (newScale) {
                scale = { x: newScale.x, y: newScale.y };
            }
            return scale;
        },
        scaleX: () => scale.x,
        scaleY: () => scale.y,
        // A size set via konvaTestControls wins over the setter: EditorStage sizes the stage to its
        // container, which measures 0 × 0 under jsdom.
        width: (value) => {
            if (value !== undefined) {
                size.width = value;
            }
            return controls.stageSize?.width ?? size.width;
        },
        height: (value) => {
            if (value !== undefined) {
                size.height = value;
            }
            return controls.stageSize?.height ?? size.height;
        },
        getPointerPosition: () => controls.pointerOverride ?? controls.lastPointer,
        getRelativePointerPosition: () => {
            const pointer = stage.getPointerPosition();
            if (!pointer) {
                return null;
            }
            return { x: (pointer.x - position.x) / scale.x, y: (pointer.y - position.y) / scale.y };
        },
        batchDraw: () => undefined,
        getStage: () => stage,
    };
    return stage;
};

/** Drives the fake Stage from tests. Reset after every test in `vitest.setup.ts`. */
export const konvaTestControls = {
    /** Viewport size reported by `stage.width()` / `stage.height()`. */
    setStageSize: (size: Size | null): void => {
        controls.stageSize = size;
    },
    /** Pointer reported by `stage.getPointerPosition()`; `null` falls back to the last event's client position. */
    setPointerPosition: (point: Point | null): void => {
        controls.pointerOverride = point;
    },
    /** The fake Stage of the currently mounted `<Stage>`, or `null`. */
    getMountedStage: (): FakeStage | null => mountedStage,
    /** Bounding box reported by `layer.getClientRect()` of every `<Layer ref>`. */
    setLayerClientRect: (rect: ClientRect): void => {
        controls.layerClientRect = rect;
    },
    /** Image returned by `layer.toDataURL()`; defaults to an empty canvas (`"data:,"`). */
    setLayerDataUrl: (dataUrl: string): void => {
        controls.layerDataUrl = dataUrl;
    },
    /** Makes `layer.toDataURL()` throw `error`; `null` restores the data URL. */
    setLayerDataUrlError: (error: unknown): void => {
        controls.layerDataUrlError = error;
    },
    reset: (): void => {
        Object.assign(controls, createDefaultControls());
    },
};

const createFakeLayer = (): FakeLayer => ({
    getClientRect: () => ({ ...controls.layerClientRect }),
    // No Konva nodes exist, so a search for e.g. images finds none.
    find: () => [],
    toDataURL: () => {
        if (controls.layerDataUrlError !== null) {
            throw controls.layerDataUrlError;
        }
        return controls.layerDataUrl;
    },
    batchDraw: () => undefined,
});

const LayerStub = ({ children, ref }: { children?: ReactNode; ref?: Ref<FakeLayer> }) => {
    const [layer] = useState(createFakeLayer);
    useImperativeHandle(ref, () => layer, [layer]);
    return stub("konva-layer", {}, children);
};

const nodePositions = new WeakMap<object, Point>();

const positionOf = (element: object): Point => nodePositions.get(element) ?? { x: 0, y: 0 };

const sharedLayerOfNodes = {
    batchDraw: () => undefined,
};

// Fills in the Konva node API that handlers call on `event.target`. Only missing properties
// are added, so a stub assigned via `fireEvent(element, { target: stub })` keeps precedence.
const toKonvaNode = (element: EventTarget | null): Record<string, unknown> => {
    const node = (element ?? {}) as Record<string, unknown>;
    const defaults: Record<string, unknown> = {
        getStage: () => mountedStage,
        getLayer: () => sharedLayerOfNodes,
        x: () => positionOf(node).x,
        y: () => positionOf(node).y,
        position: (point?: Point) => {
            if (point) {
                nodePositions.set(node, { ...point });
            }
            return positionOf(node);
        },
        setPosition: (point: Point) => {
            nodePositions.set(node, { ...point });
        },
        stopDrag: () => undefined,
        startDrag: () => undefined,
    };
    for (const [name, value] of Object.entries(defaults)) {
        if (!(name in node)) {
            node[name] = value;
        }
    }
    return node;
};

const toKonvaEvent = (domEvent: SyntheticEvent, target?: Record<string, unknown>): KonvaTestEvent => ({
    evt: domEvent.nativeEvent,
    target: target ?? toKonvaNode(domEvent.target),
    currentTarget: toKonvaNode(domEvent.currentTarget),
    cancelBubble: false,
});

const toDomHandler = (handler: unknown) => {
    if (typeof handler !== "function") {
        return undefined;
    }
    return (domEvent: SyntheticEvent) => {
        const konvaEvent = toKonvaEvent(domEvent);
        (handler as KonvaHandler)(konvaEvent);
        if (konvaEvent.cancelBubble) {
            domEvent.stopPropagation();
        }
    };
};

// Konva handler prop → React DOM handler prop. `onTap` has no DOM twin; touchend is the closest.
const KONVA_TO_DOM_EVENT_PROPS: Record<string, string> = {
    onClick: "onClick",
    onTap: "onTouchEnd",
    onDblClick: "onDoubleClick",
    onMouseDown: "onMouseDown",
    onMouseEnter: "onMouseEnter",
    onMouseLeave: "onMouseLeave",
    onMouseOver: "onMouseOver",
    onMouseOut: "onMouseOut",
    onDragStart: "onDragStart",
    onDragMove: "onDrag",
    onDragEnd: "onDragEnd",
};

const mapHandlers = (props: AnyProps, konvaNames: string[]): Record<string, unknown> => {
    const handlers: Record<string, unknown> = {};
    for (const konvaName of konvaNames) {
        const domHandler = toDomHandler(props[konvaName]);
        if (domHandler) {
            handlers[KONVA_TO_DOM_EVENT_PROPS[konvaName]!] = domHandler;
        }
    }
    return handlers;
};

const STAGE_EVENT_PROPS: Record<string, string> = {
    onMouseDown: "onMouseDown",
    onMouseMove: "onMouseMove",
    onMouseUp: "onMouseUp",
    onMouseLeave: "onMouseLeave",
    onContextMenu: "onContextMenu",
    onWheel: "onWheel",
    onClick: "onClick",
    onDragOver: "onDragOver",
};

// Typed locally: vitest.setup.ts imports this module under a tsconfig without the DOM lib.
interface PointerCoordinates {
    clientX?: number;
    clientY?: number;
    layerX?: number;
    layerY?: number;
}

const rememberPointer = (domEvent: SyntheticEvent): void => {
    const { clientX, clientY } = domEvent.nativeEvent as PointerCoordinates;
    if (typeof clientX === "number" && typeof clientY === "number") {
        controls.lastPointer = { x: clientX, y: clientY };
    }
};

// jsdom's MouseEvent has no layerX/layerY; Konva handlers read them for the pointer in the stage.
const withLayerCoordinates = (nativeEvent: Event): Event => {
    const coordinates = nativeEvent as Event & PointerCoordinates;
    if (coordinates.layerX === undefined && typeof coordinates.clientX === "number") {
        Object.defineProperty(coordinates, "layerX", { value: coordinates.clientX });
        Object.defineProperty(coordinates, "layerY", { value: coordinates.clientY });
    }
    return coordinates;
};

const StageStub = ({ children, ref, ...props }: AnyProps & { children?: ReactNode; ref?: Ref<FakeStage> }) => {
    const [stage] = useState(createFakeStage);
    useImperativeHandle(ref, () => stage, [stage]);

    useLayoutEffect(() => {
        mountedStage = stage;
        return () => {
            if (mountedStage === stage) {
                mountedStage = null;
            }
        };
    }, [stage]);

    const handlers: Record<string, unknown> = {};
    for (const [konvaName, domName] of Object.entries(STAGE_EVENT_PROPS)) {
        const handler = props[konvaName];
        if (typeof handler !== "function") {
            continue;
        }
        handlers[domName] = (domEvent: SyntheticEvent) => {
            // Konva reports the stage itself as target only when no shape was hit.
            const target =
                domEvent.target === domEvent.currentTarget
                    ? (stage as unknown as Record<string, unknown>)
                    : toKonvaNode(domEvent.target);
            const konvaEvent = toKonvaEvent(domEvent, target);
            konvaEvent.evt = withLayerCoordinates(konvaEvent.evt);
            konvaEvent.currentTarget = stage as unknown as Record<string, unknown>;
            (handler as KonvaHandler)(konvaEvent);
        };
    }

    return createElement(
        "div",
        {
            "data-testid": "konva-stage",
            ref: (element: HTMLDivElement | null) => {
                stage.content = element;
            },
            // Capture phase: the pointer must be current before any shape handler runs.
            onMouseDownCapture: rememberPointer,
            onMouseMoveCapture: rememberPointer,
            onMouseUpCapture: rememberPointer,
            onClickCapture: rememberPointer,
            onContextMenuCapture: rememberPointer,
            onWheelCapture: rememberPointer,
            ...handlers,
        },
        children
    );
};

export const konvaMock = () => ({
    Stage: StageStub,
    Layer: LayerStub,
    Group: (props: AnyProps) =>
        createElement(
            "div",
            {
                "data-testid": "konva-group",
                ...mapHandlers(props, [
                    "onClick",
                    "onTap",
                    "onDblClick",
                    "onMouseDown",
                    "onMouseEnter",
                    "onMouseLeave",
                    "onMouseOver",
                    "onMouseOut",
                    "onDragStart",
                    "onDragMove",
                    "onDragEnd",
                ]),
            },
            props["children"] as ReactNode
        ),

    Line: (props: AnyProps) =>
        createElement("div", {
            "data-testid": "konva-line",
            "data-stroke": str(props["stroke"]),
            "data-stroke-width": str(props["strokeWidth"]),
            "data-listening": str(props["listening"]),
            "data-points": json(props["points"]),
            "data-dash": json(props["dash"]),
            "data-draggable": str(props["draggable"]),
            "data-drag-distance": str(props["dragDistance"]),
            // Map Konva drag/click/hover handlers to standard DOM events so tests can
            // use fireEvent.drag / fireEvent.dragEnd / fireEvent.click with a stub event.target.
            ...mapHandlers(props, [
                "onClick",
                "onMouseEnter",
                "onMouseLeave",
                "onMouseOver",
                "onMouseOut",
                "onDragStart",
                "onDragMove",
                "onDragEnd",
            ]),
        }),

    Rect: (props: AnyProps) =>
        stub("konva-rect", {
            "data-x": str(props["x"]),
            "data-y": str(props["y"]),
            "data-width": str(props["width"]),
            "data-height": str(props["height"]),
            "data-stroke": str(props["stroke"]),
            "data-stroke-width": str(props["strokeWidth"]),
            "data-dash": json(props["dash"]),
        }),

    Circle: (props: AnyProps) =>
        createElement("div", {
            "data-testid": "konva-circle",
            "data-x": str(props["x"]),
            "data-y": str(props["y"]),
            "data-radius": str(props["radius"]),
            "data-stroke": str(props["stroke"]),
            "data-stroke-width": str(props["strokeWidth"]),
            "data-draggable": str(props["draggable"]),
            // Map Konva drag/click handlers to standard DOM events so tests can
            // use fireEvent.drag / fireEvent.dragEnd / fireEvent.dblClick.
            ...mapHandlers(props, ["onDragMove", "onDragEnd", "onDblClick"]),
        }),

    Arrow: (props: AnyProps) =>
        stub("konva-arrow", {
            "data-points": json(props["points"]),
            "data-stroke": str(props["stroke"]),
            "data-fill": str(props["fill"]),
            "data-stroke-width": str(props["strokeWidth"]),
        }),

    Arc: (props: AnyProps) =>
        createElement("div", {
            "data-testid": "konva-arc",
            "data-fill": str(props["fill"]),
            ...mapHandlers(props, ["onClick", "onMouseOver", "onMouseOut"]),
        }),

    Image: (props: AnyProps) =>
        createElement("div", {
            "data-testid": "konva-image",
            ...mapHandlers(props, ["onClick", "onTap", "onMouseEnter", "onMouseLeave", "onMouseOver", "onMouseOut"]),
        }),
    Text: (props: AnyProps) => stub("konva-text", { "data-text": str(props["text"]) }),
    Transformer: (props: AnyProps) =>
        stub("konva-transformer", {
            "data-visible": str(props["visible"] === false ? false : true),
        }),
});

// jsdom has no real Konva runtime, so the portal collapses to a plain div.
export const konvaUtilsMock = () => ({
    Html: ({ children }: { children?: ReactNode }) => createElement("div", { "data-testid": "konva-html" }, children),
});
