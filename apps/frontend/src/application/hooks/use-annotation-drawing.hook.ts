import { useState, type RefObject } from "react";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";
import { DEFAULT_TEXT_FONT_SIZE, type AnnotationType, type Coordinate } from "#api/types/system.types.ts";
import { DEFAULT_ANNOTATION_TEXT_COLOR } from "#view/colors/annotation.colors.ts";
import type { useEditorAnnotations } from "./use-editor-annotations.hook";

// Visible stroke width for new annotations — matches the system connection-line
export const ANNOTATION_STROKE_WIDTH = 3;
// Minimum dimension for a drawn annotation
const MIN_DRAW_DIMENSION = 5;
const DEFAULT_TEXT_BOX_WIDTH = 160;
const DEFAULT_TEXT_BOX_HEIGHT = 40;

export interface BoxDrawingState {
    kind: "box";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
}

export interface FreehandDrawingState {
    kind: "freehand";
    points: number[];
}

export type AnnotationDrawingState = BoxDrawingState | FreehandDrawingState;

interface UseAnnotationDrawingArgs {
    stageRef: RefObject<KonvaStage | null>;
    layerPosition: Coordinate;
    isEditor: boolean;
    annotationColor: string;
    createAnnotation: ReturnType<typeof useEditorAnnotations>["createAnnotation"];
}

export const useAnnotationDrawing = ({
    stageRef,
    layerPosition,
    isEditor,
    annotationColor,
    createAnnotation,
}: UseAnnotationDrawingArgs) => {
    const [drawingPreview, setDrawingPreview] = useState<AnnotationDrawingState | null>(null);

    const stageToLayerCoords = (): { x: number; y: number } | null => {
        const pos = stageRef.current?.getRelativePointerPosition();
        if (!pos) {
            return null;
        }
        return { x: pos.x - layerPosition.x, y: pos.y - layerPosition.y };
    };

    const cancelDrawing = (): void => {
        setDrawingPreview(null);
    };

    /** Try to start a draw. Returns true if started — caller should return early. */
    const tryStartDrawing = (annotationTool: AnnotationType | null, event: KonvaEventObject<MouseEvent>): boolean => {
        const { evt } = event;
        if (!annotationTool || !isEditor || evt.button !== 0) {
            return false;
        }
        const local = stageToLayerCoords();
        if (!local) {
            return false;
        }
        evt.preventDefault();
        event.cancelBubble = true;
        if (annotationTool === "freehand") {
            setDrawingPreview({ kind: "freehand", points: [local.x, local.y] });
        } else {
            setDrawingPreview({
                kind: "box",
                startX: local.x,
                startY: local.y,
                currentX: local.x,
                currentY: local.y,
            });
        }
        return true;
    };

    /** Update the in-progress preview from the current pointer position. Returns true if a draw is active. */
    const updateDrawingPreview = (): boolean => {
        if (!drawingPreview) {
            return false;
        }
        const local = stageToLayerCoords();
        if (!local) {
            return true;
        }
        if (drawingPreview.kind === "freehand") {
            setDrawingPreview((prev) =>
                prev && prev.kind === "freehand"
                    ? { kind: "freehand", points: [...prev.points, local.x, local.y] }
                    : prev
            );
            return true;
        }
        setDrawingPreview((prev) =>
            prev && prev.kind === "box" ? { ...prev, currentX: local.x, currentY: local.y } : prev
        );
        return true;
    };

    /** Commit the in-progress drawing. Returns the new annotation id, or null if nothing was drawn. */
    const commitDrawing = (annotationTool: AnnotationType | null): string | null => {
        if (!drawingPreview || !annotationTool) {
            setDrawingPreview(null);
            return null;
        }
        const preview = drawingPreview;
        setDrawingPreview(null);

        if (annotationTool === "freehand") {
            if (preview.kind !== "freehand" || preview.points.length < 4) {
                // Single click or zero-length stroke — not enough geometry to render
                return null;
            }
            return createAnnotation({
                type: "freehand",
                x: 0,
                y: 0,
                points: preview.points,
                stroke: annotationColor,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
            });
        }

        if (preview.kind !== "box") {
            return null;
        }
        const { startX, startY, currentX, currentY } = preview;
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        if (annotationTool === "text") {
            const usingDefault = width < MIN_DRAW_DIMENSION && height < MIN_DRAW_DIMENSION;
            const finalWidth = usingDefault ? DEFAULT_TEXT_BOX_WIDTH : Math.max(width, MIN_DRAW_DIMENSION);
            const finalHeight = usingDefault ? DEFAULT_TEXT_BOX_HEIGHT : Math.max(height, MIN_DRAW_DIMENSION);
            return createAnnotation({
                type: "text",
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                width: finalWidth,
                height: finalHeight,
                text: "",
                fontSize: DEFAULT_TEXT_FONT_SIZE,
                stroke: DEFAULT_ANNOTATION_TEXT_COLOR,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
            });
        }

        if (width < MIN_DRAW_DIMENSION && height < MIN_DRAW_DIMENSION) {
            return null;
        }

        if (annotationTool === "rect") {
            return createAnnotation({
                type: "rect",
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                width,
                height,
                stroke: annotationColor,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
            });
        }
        if (annotationTool === "circle") {
            return createAnnotation({
                type: "circle",
                x: (startX + currentX) / 2,
                y: (startY + currentY) / 2,
                radius: Math.max(width, height) / 2,
                stroke: annotationColor,
                strokeWidth: ANNOTATION_STROKE_WIDTH,
            });
        }
        // line | arrow — share the same points-array geometry.
        return createAnnotation({
            type: annotationTool,
            x: 0,
            y: 0,
            points: [startX, startY, currentX, currentY],
            stroke: annotationColor,
            strokeWidth: ANNOTATION_STROKE_WIDTH,
        });
    };

    return {
        drawingPreview,
        cancelDrawing,
        tryStartDrawing,
        updateDrawingPreview,
        commitDrawing,
    };
};
