import { useState, type RefObject } from "react";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { KonvaEventObject } from "konva/lib/Node";
import type { AnnotationType, Coordinate } from "#api/types/system.types.ts";
import type { AnnotationDrawingState } from "../../view/components/editor-components/annotation-drawing-preview.component";
import { DEFAULT_ANNOTATION_COLOR } from "../../view/components/editor-components/editor-color-picker.component";
import type { useEditorAnnotations } from "./use-editor-annotations.hook";

// Visible stroke width for new annotations — matches the system connection-line
export const ANNOTATION_STROKE_WIDTH = 3;
// Drag distance below this is treated as a click (no shape committed) — except
// for line, where a horizontal/vertical line legitimately has zero in one axis.
const MIN_DRAW_DIMENSION = 5;

interface UseAnnotationDrawingArgs {
    stageRef: RefObject<KonvaStage | null>;
    layerPosition: Coordinate;
    isEditor: boolean;
    createAnnotation: ReturnType<typeof useEditorAnnotations>["createAnnotation"];
}

export const useAnnotationDrawing = ({
    stageRef,
    layerPosition,
    isEditor,
    createAnnotation,
}: UseAnnotationDrawingArgs) => {
    const [annotationColor, setAnnotationColor] = useState<string>(DEFAULT_ANNOTATION_COLOR);
    const [drawingPreview, setDrawingPreview] = useState<AnnotationDrawingState | null>(null);

    const stageToLayerCoords = (pointerX: number, pointerY: number): { x: number; y: number } | null => {
        const stage = stageRef.current;
        if (!stage) {
            return null;
        }
        return {
            x: (pointerX - stage.x()) / stage.scaleX() - layerPosition.x,
            y: (pointerY - stage.y()) / stage.scaleY() - layerPosition.y,
        };
    };

    const cancelDrawing = (): void => {
        setDrawingPreview(null);
    };

    /** Try to start a draw. Returns true if started — caller should return early. */
    const tryStartDrawing = (annotationTool: AnnotationType | null, event: KonvaEventObject<MouseEvent>): boolean => {
        const { evt, target } = event;
        if (!annotationTool || !isEditor || evt.button !== 0 || target.nodeType !== "Stage") {
            return false;
        }
        const stage = stageRef.current;
        const pointer = stage?.getPointerPosition();
        if (!stage || !pointer) {
            return false;
        }
        const local = stageToLayerCoords(pointer.x, pointer.y);
        if (!local) {
            return false;
        }
        evt.preventDefault();
        event.cancelBubble = true;
        setDrawingPreview({ startX: local.x, startY: local.y, currentX: local.x, currentY: local.y });
        return true;
    };

    /** Update the in-progress preview from a layer-pointer position. Returns true if a draw is active. */
    const updateDrawingPreview = (layerX: number, layerY: number): boolean => {
        if (!drawingPreview) {
            return false;
        }
        const local = stageToLayerCoords(layerX, layerY);
        if (local) {
            setDrawingPreview((prev) => (prev ? { ...prev, currentX: local.x, currentY: local.y } : prev));
        }
        return true;
    };

    /** Commit the in-progress drawing. Returns the new annotation id, or null if nothing was drawn. */
    const commitDrawing = (annotationTool: AnnotationType | null): string | null => {
        if (!drawingPreview || !annotationTool) {
            setDrawingPreview(null);
            return null;
        }
        const { startX, startY, currentX, currentY } = drawingPreview;
        setDrawingPreview(null);

        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        if (width < MIN_DRAW_DIMENSION && height < MIN_DRAW_DIMENSION && annotationTool !== "line") {
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
        annotationColor,
        setAnnotationColor,
        cancelDrawing,
        tryStartDrawing,
        updateDrawingPreview,
        commitDrawing,
    };
};
