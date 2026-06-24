/**
 * @module konva-mock - Shared `react-konva` mock applied globally via `vitest.setup.ts`.
 *
 * react-konva renders into a real `<canvas>` and requires a `<Stage>` ancestor at runtime,
 * neither of which work under jsdom. Every test in this codebase wants the same stub:
 * shape components render as plain `<div>`s carrying their interesting props as
 * `data-*` attributes so tests can assert on geometry/stroke/etc.
 *
 * Wired once in `vitest.setup.ts` so individual test files don't need their own
 * `vi.mock("react-konva", ...)` block — a per-file mock would collide with this one
 * under `isolate: false`.
 *
 * Uses `React.createElement` instead of JSX so the file stays a plain `.ts` module —
 * keeps `vitest.setup.ts` JSX-free and side-steps tsconfig friction for non-`src` files.
 */
import { createElement, type ReactNode } from "react";

type AnyProps = Record<string, unknown>;

const stub = (testid: string, dataProps: Record<string, string> = {}, children?: ReactNode) =>
    createElement("div", { "data-testid": testid, ...dataProps }, children);

const str = (value: unknown): string => (value === undefined ? "undefined" : String(value));
const json = (value: unknown): string => JSON.stringify(value);

export const konvaMock = () => ({
    Stage: ({ children }: { children?: ReactNode }) => stub("konva-stage", {}, children),
    Layer: ({ children }: { children?: ReactNode }) => stub("konva-layer", {}, children),
    Group: ({ children }: { children?: ReactNode }) => stub("konva-group", {}, children),

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
            // Map Konva drag/click handlers to standard DOM events so tests can
            // use fireEvent.drag / fireEvent.dragEnd / fireEvent.click with a stub event.target.
            onDrag: props["onDragMove"] as () => void,
            onDragEnd: props["onDragEnd"] as () => void,
            onClick: props["onClick"] as () => void,
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
            onDrag: props["onDragMove"] as () => void,
            onDragEnd: props["onDragEnd"] as () => void,
            onDoubleClick: props["onDblClick"] as () => void,
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
            onMouseOver: props["onMouseOver"] as () => void,
            onMouseOut: props["onMouseOut"] as () => void,
        }),

    Image: () => stub("konva-image"),
    Text: () => stub("konva-text"),
    Transformer: (props: AnyProps) =>
        stub("konva-transformer", {
            "data-visible": str(props["visible"] === false ? false : true),
        }),
});

// jsdom has no real Konva runtime, so the portal collapses to a plain div.
export const konvaUtilsMock = () => ({
    Html: ({ children }: { children?: ReactNode }) => createElement("div", { "data-testid": "konva-html" }, children),
});
