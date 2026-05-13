import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";
import { useAnnotationDrawing, ANNOTATION_STROKE_WIDTH } from "./use-annotation-drawing.hook";

const TEST_DEFAULT_COLOR = "#5786ff";

const makeStageRef = (pointer: { x: number; y: number } | null): RefObject<KonvaStage | null> =>
    ({
        current: {
            getRelativePointerPosition: () => pointer,
        },
    }) as unknown as RefObject<KonvaStage | null>;

const makeStageEvent = (overrides: Partial<{ button: number; nodeType: string }> = {}) => {
    const evt = {
        button: overrides.button ?? 0,
        preventDefault: vi.fn(),
    };
    return {
        evt,
        target: { nodeType: overrides.nodeType ?? "Stage" },
        cancelBubble: false,
    } as unknown as KonvaEventObject<MouseEvent>;
};

const setup = (overrides: Partial<Parameters<typeof useAnnotationDrawing>[0]> = {}) => {
    const createAnnotation = vi.fn((annotation: object) => `id-${JSON.stringify(annotation).length}`);
    const stageRef = overrides.stageRef ?? makeStageRef({ x: 100, y: 100 });
    return renderHook(() =>
        useAnnotationDrawing({
            stageRef,
            layerPosition: { x: 0, y: 0 },
            isEditor: true,
            annotationColor: TEST_DEFAULT_COLOR,
            createAnnotation,
            ...overrides,
        })
    );
};

describe("useAnnotationDrawing", () => {
    describe("initial state", () => {
        it("starts with no drawing preview", () => {
            const { result } = setup();
            expect(result.current.drawingPreview).toBeNull();
        });
    });

    describe("tryStartDrawing", () => {
        it("returns false and does not create a preview when annotationTool is null", () => {
            const { result } = setup();

            let started: boolean | undefined;
            act(() => {
                started = result.current.tryStartDrawing(null, makeStageEvent());
            });

            expect(started).toBe(false);
            expect(result.current.drawingPreview).toBeNull();
        });

        it("returns false when not in editor mode", () => {
            const { result } = setup({ isEditor: false });

            let started: boolean | undefined;
            act(() => {
                started = result.current.tryStartDrawing("rect", makeStageEvent());
            });

            expect(started).toBe(false);
            expect(result.current.drawingPreview).toBeNull();
        });

        it("returns false when the mouse button is not the primary button", () => {
            const { result } = setup();

            let started: boolean | undefined;
            act(() => {
                started = result.current.tryStartDrawing("rect", makeStageEvent({ button: 2 }));
            });

            expect(started).toBe(false);
            expect(result.current.drawingPreview).toBeNull();
        });

        it("returns false when the click target is not the Stage", () => {
            const { result } = setup();

            let started: boolean | undefined;
            act(() => {
                started = result.current.tryStartDrawing("rect", makeStageEvent({ nodeType: "Shape" }));
            });

            expect(started).toBe(false);
            expect(result.current.drawingPreview).toBeNull();
        });

        it("returns false when the stage has no pointer position", () => {
            const stageRef = makeStageRef(null);
            const { result } = setup({ stageRef });

            let started: boolean | undefined;
            act(() => {
                started = result.current.tryStartDrawing("rect", makeStageEvent());
            });

            expect(started).toBe(false);
            expect(result.current.drawingPreview).toBeNull();
        });

        it("returns true and seeds the preview with stage-to-layer coords on a valid start", () => {
            const stageRef = makeStageRef({ x: 100, y: 100 });
            const { result } = setup({ stageRef, layerPosition: { x: 30, y: 20 } });
            const event = makeStageEvent();

            let started: boolean | undefined;
            act(() => {
                started = result.current.tryStartDrawing("rect", event);
            });

            expect(started).toBe(true);
            expect(result.current.drawingPreview).toEqual({
                kind: "box",
                startX: 70,
                startY: 80,
                currentX: 70,
                currentY: 80,
            });
            expect(event.evt.preventDefault).toHaveBeenCalledTimes(1);
            expect(event.cancelBubble).toBe(true);
        });
    });

    describe("updateDrawingPreview", () => {
        it("returns false when no draw is active", () => {
            const { result } = setup();

            let updated: boolean | undefined;
            act(() => {
                updated = result.current.updateDrawingPreview();
            });

            expect(updated).toBe(false);
        });

        it("returns true and moves currentX/currentY to the new pointer position", () => {
            const pointer = { x: 100, y: 100 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const { result } = setup({ stageRef });

            act(() => {
                result.current.tryStartDrawing("rect", makeStageEvent());
            });

            pointer.x = 220;
            pointer.y = 180;

            let updated: boolean | undefined;
            act(() => {
                updated = result.current.updateDrawingPreview();
            });

            expect(updated).toBe(true);
            expect(result.current.drawingPreview).toEqual({
                kind: "box",
                startX: 100,
                startY: 100,
                currentX: 220,
                currentY: 180,
            });
        });
    });

    describe("cancelDrawing", () => {
        it("clears the active preview", () => {
            const { result } = setup();

            act(() => {
                result.current.tryStartDrawing("rect", makeStageEvent());
            });
            expect(result.current.drawingPreview).not.toBeNull();

            act(() => {
                result.current.cancelDrawing();
            });

            expect(result.current.drawingPreview).toBeNull();
        });
    });

    describe("commitDrawing", () => {
        it("returns null and does not call createAnnotation when no draw is active", () => {
            const createAnnotation = vi.fn();
            const { result } = setup({ createAnnotation });

            let id: string | null = "stub";
            act(() => {
                id = result.current.commitDrawing("rect");
            });

            expect(id).toBeNull();
            expect(createAnnotation).not.toHaveBeenCalled();
        });

        it("returns null and clears the preview if the drag was below the minimum dimension", () => {
            const pointer = { x: 100, y: 100 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const createAnnotation = vi.fn();
            const { result } = setup({ stageRef, createAnnotation });

            act(() => {
                result.current.tryStartDrawing("rect", makeStageEvent());
            });
            // Move only 2px — well below MIN_DRAW_DIMENSION (5)
            pointer.x = 102;
            pointer.y = 102;
            act(() => {
                result.current.updateDrawingPreview();
            });

            let id: string | null = "stub";
            act(() => {
                id = result.current.commitDrawing("rect");
            });

            expect(id).toBeNull();
            expect(createAnnotation).not.toHaveBeenCalled();
            expect(result.current.drawingPreview).toBeNull();
        });

        it("creates a rect annotation with normalized x/y/width/height", () => {
            // Drag from (200,200) to (100,150) — start is bottom-right of the final rect.
            const pointer = { x: 200, y: 200 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const createAnnotation = vi.fn().mockReturnValue("ann-1");
            const { result } = setup({ stageRef, createAnnotation });

            act(() => {
                result.current.tryStartDrawing("rect", makeStageEvent());
            });
            pointer.x = 100;
            pointer.y = 150;
            act(() => {
                result.current.updateDrawingPreview();
            });

            let id: string | null = null;
            act(() => {
                id = result.current.commitDrawing("rect");
            });

            expect(id).toBe("ann-1");
            expect(createAnnotation).toHaveBeenCalledWith({
                type: "rect",
                x: 100,
                y: 150,
                width: 100,
                height: 50,
                stroke: TEST_DEFAULT_COLOR,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
            });
        });

        it("creates a circle annotation centered between start and current with max-side radius", () => {
            const pointer = { x: 100, y: 100 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const createAnnotation = vi.fn().mockReturnValue("ann-c");
            const { result } = setup({ stageRef, createAnnotation });

            act(() => {
                result.current.tryStartDrawing("circle", makeStageEvent());
            });
            pointer.x = 200;
            pointer.y = 140;
            act(() => {
                result.current.updateDrawingPreview();
            });

            act(() => {
                result.current.commitDrawing("circle");
            });

            expect(createAnnotation).toHaveBeenCalledWith({
                type: "circle",
                x: 150,
                y: 120,
                radius: 50,
                stroke: TEST_DEFAULT_COLOR,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
            });
        });

        it.each(["line", "arrow"] as const)("creates a %s annotation with the four-point geometry", (tool) => {
            const pointer = { x: 50, y: 60 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const createAnnotation = vi.fn().mockReturnValue("ann-l");
            const { result } = setup({ stageRef, createAnnotation });

            act(() => {
                result.current.tryStartDrawing(tool, makeStageEvent());
            });
            pointer.x = 200;
            pointer.y = 240;
            act(() => {
                result.current.updateDrawingPreview();
            });

            act(() => {
                result.current.commitDrawing(tool);
            });

            expect(createAnnotation).toHaveBeenCalledWith({
                type: tool,
                x: 0,
                y: 0,
                points: [50, 60, 200, 240],
                stroke: TEST_DEFAULT_COLOR,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
            });
        });

        it("uses the supplied annotationColor for the stroke", () => {
            const pointer = { x: 0, y: 0 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const createAnnotation = vi.fn().mockReturnValue("ann-1");
            const { result } = setup({ stageRef, createAnnotation, annotationColor: "#abcdef" });

            act(() => {
                result.current.tryStartDrawing("rect", makeStageEvent());
            });
            pointer.x = 80;
            pointer.y = 80;
            act(() => {
                result.current.updateDrawingPreview();
            });
            act(() => {
                result.current.commitDrawing("rect");
            });

            expect(createAnnotation).toHaveBeenCalledWith(expect.objectContaining({ stroke: "#abcdef" }));
        });

        it("clears the preview after a successful commit", () => {
            const pointer = { x: 0, y: 0 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const { result } = setup({ stageRef });

            act(() => {
                result.current.tryStartDrawing("rect", makeStageEvent());
            });
            pointer.x = 80;
            pointer.y = 80;
            act(() => {
                result.current.updateDrawingPreview();
            });
            act(() => {
                result.current.commitDrawing("rect");
            });

            expect(result.current.drawingPreview).toBeNull();
        });
    });

    describe("freehand drawing", () => {
        it("seeds a freehand preview with the start point on tryStartDrawing", () => {
            const stageRef = makeStageRef({ x: 100, y: 100 });
            const { result } = setup({ stageRef, layerPosition: { x: 30, y: 20 } });

            act(() => {
                result.current.tryStartDrawing("freehand", makeStageEvent());
            });

            expect(result.current.drawingPreview).toEqual({ kind: "freehand", points: [70, 80] });
        });

        it("appends new points on updateDrawingPreview", () => {
            const pointer = { x: 100, y: 100 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const { result } = setup({ stageRef });

            act(() => {
                result.current.tryStartDrawing("freehand", makeStageEvent());
            });
            pointer.x = 110;
            pointer.y = 105;
            act(() => {
                result.current.updateDrawingPreview();
            });
            pointer.x = 130;
            pointer.y = 120;
            act(() => {
                result.current.updateDrawingPreview();
            });

            expect(result.current.drawingPreview).toEqual({
                kind: "freehand",
                points: [100, 100, 110, 105, 130, 120],
            });
        });

        it("commits a freehand annotation with the captured points", () => {
            const pointer = { x: 50, y: 50 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const createAnnotation = vi.fn().mockReturnValue("ann-fh");
            const { result } = setup({ stageRef, createAnnotation });

            act(() => {
                result.current.tryStartDrawing("freehand", makeStageEvent());
            });
            pointer.x = 70;
            pointer.y = 65;
            act(() => {
                result.current.updateDrawingPreview();
            });
            pointer.x = 100;
            pointer.y = 80;
            act(() => {
                result.current.updateDrawingPreview();
            });

            let id: string | null = null;
            act(() => {
                id = result.current.commitDrawing("freehand");
            });

            expect(id).toBe("ann-fh");
            expect(createAnnotation).toHaveBeenCalledWith({
                type: "freehand",
                x: 0,
                y: 0,
                points: [50, 50, 70, 65, 100, 80],
                stroke: TEST_DEFAULT_COLOR,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
            });
        });

        it("returns null and skips createAnnotation when only one point was captured (single click)", () => {
            const stageRef = makeStageRef({ x: 100, y: 100 });
            const createAnnotation = vi.fn();
            const { result } = setup({ stageRef, createAnnotation });

            act(() => {
                result.current.tryStartDrawing("freehand", makeStageEvent());
            });
            // No moves — commit immediately

            let id: string | null = "stub";
            act(() => {
                id = result.current.commitDrawing("freehand");
            });

            expect(id).toBeNull();
            expect(createAnnotation).not.toHaveBeenCalled();
        });
    });

    describe("text drawing", () => {
        it("commits a dragged text annotation with the bounding-box dimensions", () => {
            const pointer = { x: 50, y: 60 };
            const stageRef = {
                current: { getRelativePointerPosition: () => pointer },
            } as unknown as RefObject<KonvaStage | null>;
            const createAnnotation = vi.fn().mockReturnValue("ann-text");
            const { result } = setup({ stageRef, createAnnotation });

            act(() => {
                result.current.tryStartDrawing("text", makeStageEvent());
            });
            pointer.x = 250;
            pointer.y = 120;
            act(() => {
                result.current.updateDrawingPreview();
            });

            let id: string | null = null;
            act(() => {
                id = result.current.commitDrawing("text");
            });

            expect(id).toBe("ann-text");
            expect(createAnnotation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "text",
                    x: 50,
                    y: 60,
                    width: 200,
                    height: 60,
                    text: "",
                })
            );
        });

        it("commits a text annotation with a black stroke regardless of the active color", () => {
            const stageRef = makeStageRef({ x: 100, y: 100 });
            const createAnnotation = vi.fn().mockReturnValue("ann-text");
            const { result } = setup({ stageRef, createAnnotation, annotationColor: "#ff0000" });

            act(() => {
                result.current.tryStartDrawing("text", makeStageEvent());
            });
            let id: string | null = null;
            act(() => {
                id = result.current.commitDrawing("text");
            });

            expect(id).toBe("ann-text");
            expect(createAnnotation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "text",
                    stroke: "#000000",
                })
            );
        });

        it("falls back to default dimensions on a click without drag", () => {
            const stageRef = makeStageRef({ x: 100, y: 100 });
            const createAnnotation = vi.fn().mockReturnValue("ann-text");
            const { result } = setup({ stageRef, createAnnotation });

            act(() => {
                result.current.tryStartDrawing("text", makeStageEvent());
            });
            // No drag — commit at the same point
            let id: string | null = null;
            act(() => {
                id = result.current.commitDrawing("text");
            });

            expect(id).toBe("ann-text");
            expect(createAnnotation).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "text",
                    x: 100,
                    y: 100,
                    width: 160,
                    height: 40,
                })
            );
        });
    });
});
