import { useEffect, type RefObject } from "react";
import type { KonvaEventObject, Node as KonvaNode } from "konva/lib/Node";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useAppSelector } from "./use-app-redux.hook";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import type { Annotation } from "#api/types/system.types.ts";

interface UseAnnotationInteractionArgs {
    annotation: Annotation;
    selected: boolean;
    editable: boolean;
    shapeRef: RefObject<KonvaNode | null>;
    transformerRef: RefObject<KonvaTransformer | null>;
    onSelect: (id: string, options?: { openSidebar?: boolean }) => void;
}

/**
 * Shared canvas-interaction logic for every annotation type — selection click,
 * hover cursor, transformer wiring, and the screenshot-capture / drawing-tool
 * gates. Per-type drag/transform/anchor handlers stay in each component
 * because they need shape-specific refs and geometry.
 */
export const useAnnotationInteraction = ({
    annotation,
    selected,
    editable,
    shapeRef,
    transformerRef,
    onSelect,
}: UseAnnotationInteractionArgs) => {
    const isCapturing = useAppSelector((state) => state.editor.isCapturing);
    const annotationTool = useAppSelector(editorSelectors.selectAnnotationTool);

    useEffect(() => {
        if (!selected || !editable) {
            return;
        }
        const transformer = transformerRef.current;
        const shape = shapeRef.current;
        if (transformer && shape) {
            transformer.nodes([shape]);
            transformer.getLayer()?.batchDraw();
        }
    }, [selected, editable, isCapturing, shapeRef, transformerRef]);

    const setStageCursor = (event: KonvaEventObject<MouseEvent | DragEvent>, cursor: string): void => {
        const stage = event.target.getStage();
        if (stage?.content) {
            stage.content.style.cursor = cursor;
        }
    };

    const handleClick = (event: KonvaEventObject<MouseEvent>): void => {
        if (event.evt.button !== 0) {
            return;
        }
        if (annotationTool !== null) {
            return;
        }
        event.cancelBubble = true;
        event.evt.preventDefault();
        onSelect(annotation.id);
    };

    const handleMouseEnter = (event: KonvaEventObject<MouseEvent>): void => {
        if (annotationTool !== null) {
            return;
        }
        if (editable) {
            setStageCursor(event, "pointer");
        }
    };

    const handleMouseLeave = (event: KonvaEventObject<MouseEvent>): void => {
        if (annotationTool !== null) {
            return;
        }
        setStageCursor(event, "default");
    };

    return {
        isCapturing,
        isDrawing: annotationTool !== null,
        setStageCursor,
        handleClick,
        handleMouseEnter,
        handleMouseLeave,
    };
};
