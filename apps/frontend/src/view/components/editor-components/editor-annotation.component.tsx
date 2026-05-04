import { Fragment, useEffect, useRef } from "react";
import { Arrow, Circle, Line, Rect, Transformer } from "react-konva";
import type { KonvaEventObject, Node as KonvaNode } from "konva/lib/Node";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { Annotation } from "#api/types/system.types.ts";

interface EditorAnnotationProps {
    annotation: Annotation;
    selected: boolean;
    editable: boolean;
    onSelect: (id: string) => void;
    onChange: (id: string, changes: Partial<Annotation>) => void;
}

const MIN_DIMENSION = 5;
// Mirrors the connection-line pattern in `system-component-connection.component.tsx`
const ANNOTATION_HIT_STROKE_WIDTH = 20;

export const EditorAnnotation = ({ annotation, selected, editable, onSelect, onChange }: EditorAnnotationProps) => {
    const shapeRef = useRef<KonvaNode | null>(null);
    const transformerRef = useRef<KonvaTransformer | null>(null);
    // Hide the Transformer's anchors/rotation handle during screenshot capture
    const isCapturing = useAppSelector((state) => state.editor.isCapturing);

    const setShapeRef = (node: KonvaNode | null): void => {
        shapeRef.current = node;
    };

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
    }, [selected, editable]);

    const handleClick = (event: KonvaEventObject<MouseEvent>): void => {
        if (event.evt.button !== 0) {
            return;
        }
        event.cancelBubble = true;
        event.evt.preventDefault();
        onSelect(annotation.id);
    };

    const handleDragEnd = (event: KonvaEventObject<DragEvent>): void => {
        onChange(annotation.id, { x: event.target.x(), y: event.target.y() });
    };

    // Konva's Transformer applies scaleX/scaleY to the node. Persist the
    // resolved width/height/radius and reset scale to 1 — otherwise scale
    // accumulates on subsequent transforms.
    const handleTransformEnd = (event: KonvaEventObject<Event>): void => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        const changes: Partial<Annotation> = {
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
        };

        if (annotation.type === "rect") {
            changes.width = Math.max(MIN_DIMENSION, (annotation.width ?? 0) * scaleX);
            changes.height = Math.max(MIN_DIMENSION, (annotation.height ?? 0) * scaleY);
        } else if (annotation.type === "circle") {
            changes.radius = Math.max(MIN_DIMENSION, (annotation.radius ?? 0) * scaleX);
        } else if (annotation.type === "line" || annotation.type === "arrow") {
            // Lines/arrows store geometry in `points` rather than width/height,
            // so bake the scale into each coordinate before resetting it.
            const oldPoints = annotation.points ?? [];
            changes.points = oldPoints.map((coord, idx) => coord * (idx % 2 === 0 ? scaleX : scaleY));
        }

        onChange(annotation.id, changes);
    };

    // Empty/transparent fill must NOT capture pointer events when unselected
    // — otherwise the rect interior blocks clicks on whatever sits underneath (connections, components)
    const hasFill = annotation.fill !== undefined && annotation.fill !== "transparent";
    const fillEnabled = hasFill || selected;
    const sharedHitProps = { hitStrokeWidth: ANNOTATION_HIT_STROKE_WIDTH };

    const renderShape = () => {
        switch (annotation.type) {
            case "rect":
                return (
                    <Rect
                        ref={setShapeRef}
                        x={annotation.x}
                        y={annotation.y}
                        width={annotation.width ?? 0}
                        height={annotation.height ?? 0}
                        rotation={annotation.rotation ?? 0}
                        stroke={annotation.stroke}
                        strokeWidth={annotation.strokeWidth}
                        fill={annotation.fill ?? "transparent"}
                        fillEnabled={fillEnabled}
                        listening={editable}
                        draggable={editable}
                        onClick={handleClick}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                        {...sharedHitProps}
                    />
                );
            case "circle":
                return (
                    <Circle
                        ref={setShapeRef}
                        x={annotation.x}
                        y={annotation.y}
                        radius={annotation.radius ?? 0}
                        rotation={annotation.rotation ?? 0}
                        stroke={annotation.stroke}
                        strokeWidth={annotation.strokeWidth}
                        fill={annotation.fill ?? "transparent"}
                        fillEnabled={fillEnabled}
                        listening={editable}
                        draggable={editable}
                        onClick={handleClick}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                        {...sharedHitProps}
                    />
                );
            case "line":
                return (
                    <Line
                        ref={setShapeRef}
                        x={annotation.x}
                        y={annotation.y}
                        points={annotation.points ?? []}
                        rotation={annotation.rotation ?? 0}
                        stroke={annotation.stroke}
                        strokeWidth={annotation.strokeWidth}
                        listening={editable}
                        draggable={editable}
                        onClick={handleClick}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                        {...sharedHitProps}
                    />
                );
            case "arrow":
                return (
                    <Arrow
                        ref={setShapeRef}
                        x={annotation.x}
                        y={annotation.y}
                        points={annotation.points ?? []}
                        rotation={annotation.rotation ?? 0}
                        stroke={annotation.stroke}
                        strokeWidth={annotation.strokeWidth}
                        fill={annotation.stroke}
                        pointerLength={10}
                        pointerWidth={10}
                        listening={editable}
                        draggable={editable}
                        onClick={handleClick}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                        {...sharedHitProps}
                    />
                );
        }
    };

    return (
        <Fragment>
            {renderShape()}
            {selected && editable && !isCapturing && (
                <Transformer
                    ref={transformerRef}
                    flipEnabled={false}
                    rotateEnabled={true}
                    {...(annotation.type === "circle" && {
                        enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
                    })}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (Math.abs(newBox.width) < MIN_DIMENSION || Math.abs(newBox.height) < MIN_DIMENSION) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </Fragment>
    );
};
