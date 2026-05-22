import { Fragment, memo, useRef } from "react";
import { Arrow, Circle, Line, Rect, Transformer } from "react-konva";
import type { KonvaEventObject, Node as KonvaNode } from "konva/lib/Node";
import type { Line as KonvaLineNode } from "konva/lib/shapes/Line";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useAnnotationInteraction } from "#application/hooks/use-annotation-interaction.hook.ts";
import type { Annotation, AnnotationChanges } from "#api/types/system.types.ts";
import { EditorTextAnnotation } from "./editor-text-annotation.component";

interface EditorAnnotationProps {
    annotation: Annotation;
    selected: boolean;
    editable: boolean;
    editing?: boolean;
    stageScale: number;
    onSelect: (id: string, options?: { openSidebar?: boolean }) => void;
    onChange: (id: string, changes: AnnotationChanges) => void;
    onDragStateChange?: (isDragging: boolean) => void;
    onRequestEdit?: (id: string) => void;
    onExitEdit?: (id: string) => void;
}

const MIN_DIMENSION = 5;
// Mirrors the connection-line pattern in `system-component-connection.component.tsx`
const ANNOTATION_HIT_STROKE_WIDTH = 20;
// Endpoint-anchor visuals for line/arrow editing
const ANCHOR_RADIUS = 6;

const EditorAnnotationInner = ({
    annotation,
    selected,
    editable,
    onSelect,
    onChange,
    onDragStateChange,
}: EditorAnnotationProps) => {
    const shapeRef = useRef<KonvaNode | null>(null);
    const transformerRef = useRef<KonvaTransformer | null>(null);
    const anchor0Ref = useRef<KonvaNode | null>(null);
    const anchor1Ref = useRef<KonvaNode | null>(null);

    const { isCapturing, isDrawing, setStageCursor, handleClick, handleMouseEnter, handleMouseLeave } =
        useAnnotationInteraction({
            annotation,
            selected,
            editable,
            shapeRef,
            transformerRef,
            onSelect,
        });

    const setShapeRef = (node: KonvaNode | null): void => {
        shapeRef.current = node;
    };
    const setAnchor0Ref = (node: KonvaNode | null): void => {
        anchor0Ref.current = node;
    };
    const setAnchor1Ref = (node: KonvaNode | null): void => {
        anchor1Ref.current = node;
    };

    const isLineLike = annotation.type === "line" || annotation.type === "arrow";
    const points: number[] = isLineLike ? annotation.points : [0, 0, 0, 0];

    const computeNextPoints = (idx: 0 | 1, target: KonvaNode): number[] => {
        const next = [...points];
        next[idx * 2] = target.x() - annotation.x;
        next[idx * 2 + 1] = target.y() - annotation.y;
        return next;
    };

    //  No React state mutations during drag — that's what was
    // causing the controlled-prop fight with Konva's internal drag.
    const handleAnchorDragStart = (): void => {
        onDragStateChange?.(true);
    };

    const handleAnchorDragMove =
        (idx: 0 | 1) =>
        (event: KonvaEventObject<DragEvent>): void => {
            const next = computeNextPoints(idx, event.target);
            const shape = shapeRef.current as KonvaLineNode | null;
            if (shape) {
                shape.points(next);
                shape.getLayer()?.batchDraw();
            }
        };

    const handleAnchorDragEnd =
        (idx: 0 | 1) =>
        (event: KonvaEventObject<DragEvent>): void => {
            const next = computeNextPoints(idx, event.target);
            if (annotation.type !== "line" && annotation.type !== "arrow") {
                return;
            }
            onChange(annotation.id, { type: annotation.type, points: next });
            onDragStateChange?.(false);
        };

    // Hide endpoint anchors while the line/arrow body is being dragged
    const handleDragStart = (event: KonvaEventObject<DragEvent>): void => {
        setStageCursor(event, "move");
        onDragStateChange?.(true);
        if (!isLineLike) {
            return;
        }
        anchor0Ref.current?.visible(false);
        anchor1Ref.current?.visible(false);
        event.target.getLayer()?.batchDraw();
    };

    const handleDragEnd = (event: KonvaEventObject<DragEvent>): void => {
        setStageCursor(event, "default");
        if (isLineLike) {
            anchor0Ref.current?.visible(true);
            anchor1Ref.current?.visible(true);
            event.target.getLayer()?.batchDraw();
        }

        onSelect(annotation.id, { openSidebar: false });
        onChange(annotation.id, { type: annotation.type, x: event.target.x(), y: event.target.y() });
        onDragStateChange?.(false);
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

        const base = { x: node.x(), y: node.y(), rotation: node.rotation() };

        if (annotation.type === "rect") {
            onChange(annotation.id, {
                type: "rect",
                ...base,
                width: Math.max(MIN_DIMENSION, annotation.width * scaleX),
                height: Math.max(MIN_DIMENSION, annotation.height * scaleY),
            });
            return;
        }
        if (annotation.type === "circle") {
            onChange(annotation.id, {
                type: "circle",
                ...base,
                radius: Math.max(MIN_DIMENSION, annotation.radius * scaleX),
            });
            return;
        }
        if (annotation.type === "line" || annotation.type === "arrow" || annotation.type === "freehand") {
            // Point-based shapes scale every coordinate by axis. Same path for
            // freehand because its geometry is just a longer points array.
            const scaledPoints = annotation.points.map((coord, idx) => coord * (idx % 2 === 0 ? scaleX : scaleY));
            onChange(annotation.id, { type: annotation.type, ...base, points: scaledPoints });
            return;
        }
        onChange(annotation.id, { type: "text", ...base });
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
                        draggable={editable && !isDrawing}
                        onClick={handleClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onDragStart={handleDragStart}
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
                        draggable={editable && !isDrawing}
                        onClick={handleClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onDragStart={handleDragStart}
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
                        points={points}
                        rotation={annotation.rotation ?? 0}
                        stroke={annotation.stroke}
                        strokeWidth={annotation.strokeWidth}
                        listening={editable}
                        draggable={editable && !isDrawing}
                        onClick={handleClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onDragStart={handleDragStart}
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
                        points={points}
                        rotation={annotation.rotation ?? 0}
                        stroke={annotation.stroke}
                        strokeWidth={annotation.strokeWidth}
                        fill={annotation.stroke}
                        pointerLength={10}
                        pointerWidth={10}
                        listening={editable}
                        draggable={editable && !isDrawing}
                        onClick={handleClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                        {...sharedHitProps}
                    />
                );
            case "freehand":
                return (
                    <Line
                        ref={setShapeRef}
                        x={annotation.x}
                        y={annotation.y}
                        points={annotation.points ?? []}
                        rotation={annotation.rotation ?? 0}
                        stroke={annotation.stroke}
                        strokeWidth={annotation.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        listening={editable}
                        draggable={editable && !isDrawing}
                        onClick={handleClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onTransformEnd={handleTransformEnd}
                        {...sharedHitProps}
                    />
                );
            case "text":
                // Dispatched at the EditorAnnotation level — should never reach here.
                return null;
        }
    };

    const showTransformer = selected && editable && !isCapturing && !isLineLike;
    const showAnchors = selected && editable && !isCapturing && isLineLike;

    return (
        <Fragment>
            {renderShape()}
            {showTransformer && (
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
            {showAnchors && (
                <>
                    <Circle
                        ref={setAnchor0Ref}
                        x={annotation.x + (points[0] ?? 0)}
                        y={annotation.y + (points[1] ?? 0)}
                        radius={ANCHOR_RADIUS}
                        fill="#ffffff"
                        stroke="#233c57"
                        strokeWidth={1}
                        draggable
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onDragStart={(event) => {
                            setStageCursor(event, "move");
                            handleAnchorDragStart();
                        }}
                        onDragMove={handleAnchorDragMove(0)}
                        onDragEnd={(event) => {
                            setStageCursor(event, "default");
                            handleAnchorDragEnd(0)(event);
                        }}
                    />
                    <Circle
                        ref={setAnchor1Ref}
                        x={annotation.x + (points[2] ?? 0)}
                        y={annotation.y + (points[3] ?? 0)}
                        radius={ANCHOR_RADIUS}
                        fill="#ffffff"
                        stroke="#233c57"
                        strokeWidth={1}
                        draggable
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onDragStart={(event) => {
                            setStageCursor(event, "move");
                            handleAnchorDragStart();
                        }}
                        onDragMove={handleAnchorDragMove(1)}
                        onDragEnd={(event) => {
                            setStageCursor(event, "default");
                            handleAnchorDragEnd(1)(event);
                        }}
                    />
                </>
            )}
        </Fragment>
    );
};

// Skip re-render when only callback identities change. Comparing data props only
// keeps re-renders tied to genuine annotation/selection/editing changes.
const EditorShapeAnnotation = memo(EditorAnnotationInner, (prev, next) => {
    return (
        prev.annotation === next.annotation &&
        prev.selected === next.selected &&
        prev.editable === next.editable &&
        prev.editing === next.editing
    );
});

export const EditorAnnotation = (props: EditorAnnotationProps) => {
    if (props.annotation.type === "text") {
        return (
            <EditorTextAnnotation
                annotation={props.annotation}
                selected={props.selected}
                editable={props.editable}
                editing={props.editing ?? false}
                stageScale={props.stageScale}
                onSelect={props.onSelect}
                onChange={props.onChange}
                onDragStateChange={props.onDragStateChange}
                onRequestEdit={props.onRequestEdit}
                onExitEdit={props.onExitEdit}
            />
        );
    }
    return <EditorShapeAnnotation {...props} />;
};
