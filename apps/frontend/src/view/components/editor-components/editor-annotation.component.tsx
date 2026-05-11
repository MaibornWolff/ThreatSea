import { Fragment, memo, useEffect, useRef } from "react";
import { Arrow, Circle, Group, Line, Rect, Text, Transformer } from "react-konva";
import type { KonvaEventObject, Node as KonvaNode } from "konva/lib/Node";
import type { Line as KonvaLineNode } from "konva/lib/shapes/Line";
import type { Rect as KonvaRectNode } from "konva/lib/shapes/Rect";
import type { Text as KonvaTextNode } from "konva/lib/shapes/Text";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { DEFAULT_TEXT_FONT_SIZE, TEXT_FONT_FAMILY, type Annotation } from "#api/types/system.types.ts";

const TEXT_PADDING = 4;

interface EditorAnnotationProps {
    annotation: Annotation;
    selected: boolean;
    editable: boolean;
    editing?: boolean;
    onSelect: (id: string, options?: { openSidebar?: boolean }) => void;
    onChange: (id: string, changes: Partial<Annotation>) => void;
    onDragStateChange?: (isDragging: boolean) => void;
    onRequestEdit?: (id: string) => void;
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
    editing = false,
    onSelect,
    onChange,
    onDragStateChange,
    onRequestEdit,
}: EditorAnnotationProps) => {
    const shapeRef = useRef<KonvaNode | null>(null);
    const transformerRef = useRef<KonvaTransformer | null>(null);
    const anchor0Ref = useRef<KonvaNode | null>(null);
    const anchor1Ref = useRef<KonvaNode | null>(null);
    // Inner nodes for the text annotation — needed so we can update their
    // width/height live during a Transformer resize without scaling the fontSize
    const textRectRef = useRef<KonvaRectNode | null>(null);
    const textNodeRef = useRef<KonvaTextNode | null>(null);
    // Hide the Transformer's anchors/rotation handle during screenshot capture
    const isCapturing = useAppSelector((state) => state.editor.isCapturing);

    const setShapeRef = (node: KonvaNode | null): void => {
        shapeRef.current = node;
    };
    const setAnchor0Ref = (node: KonvaNode | null): void => {
        anchor0Ref.current = node;
    };
    const setAnchor1Ref = (node: KonvaNode | null): void => {
        anchor1Ref.current = node;
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
    }, [selected, editable, isCapturing]);

    const isLineLike = annotation.type === "line" || annotation.type === "arrow";
    const isText = annotation.type === "text";
    const points = annotation.points ?? [0, 0, 0, 0];

    // Konva's <Text> uses a single `fontStyle` string for bold/italic combos.
    const textFontStyle = (() => {
        const parts: string[] = [];
        if (annotation.italic) {
            parts.push("italic");
        }
        if (annotation.bold) {
            parts.push("bold");
        }
        return parts.length > 0 ? parts.join(" ") : "normal";
    })();

    const computeNextPoints = (idx: 0 | 1, target: KonvaNode): number[] => {
        const next = [...(annotation.points ?? [0, 0, 0, 0])];
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
            onChange(annotation.id, { points: next });
            onDragStateChange?.(false);
        };

    const handleClick = (event: KonvaEventObject<MouseEvent>): void => {
        if (event.evt.button !== 0) {
            return;
        }
        event.cancelBubble = true;
        event.evt.preventDefault();
        onSelect(annotation.id);
    };

    const handleTextDblClick = (event: KonvaEventObject<MouseEvent | TouchEvent>): void => {
        if (!editable || !isText) {
            return;
        }
        event.cancelBubble = true;
        event.evt.preventDefault();
        onRequestEdit?.(annotation.id);
    };

    const setStageCursor = (event: KonvaEventObject<MouseEvent | DragEvent>, cursor: string): void => {
        const stage = event.target.getStage();
        if (stage?.content) {
            stage.content.style.cursor = cursor;
        }
    };

    const handleMouseEnter = (event: KonvaEventObject<MouseEvent>): void => {
        if (editable) {
            setStageCursor(event, "pointer");
        }
    };

    const handleMouseLeave = (event: KonvaEventObject<MouseEvent>): void => {
        setStageCursor(event, "default");
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
        onChange(annotation.id, { x: event.target.x(), y: event.target.y() });
        onDragStateChange?.(false);
    };

    const handleTextTransform = (event: KonvaEventObject<Event>): void => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rect = textRectRef.current;
        const text = textNodeRef.current;
        if (!rect || !text) {
            return;
        }
        const newWidth = Math.max(MIN_DIMENSION, rect.width() * scaleX);
        const newHeight = Math.max(MIN_DIMENSION, rect.height() * scaleY);
        rect.width(newWidth);
        rect.height(newHeight);
        text.width(newWidth);
        text.height(newHeight);
        node.scaleX(1);
        node.scaleY(1);
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

        if (annotation.type === "text") {
            const rect = textRectRef.current;
            if (rect) {
                changes.width = Math.max(MIN_DIMENSION, rect.width());
                changes.height = Math.max(MIN_DIMENSION, rect.height());
            }
        } else if (annotation.type === "rect") {
            changes.width = Math.max(MIN_DIMENSION, (annotation.width ?? 0) * scaleX);
            changes.height = Math.max(MIN_DIMENSION, (annotation.height ?? 0) * scaleY);
        } else if (annotation.type === "circle") {
            changes.radius = Math.max(MIN_DIMENSION, (annotation.radius ?? 0) * scaleX);
        } else if (annotation.type === "line" || annotation.type === "arrow" || annotation.type === "freehand") {
            // Point-based shapes scale every coordinate by axis. Same path for
            // freehand because its geometry is just a longer points array.
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
                        draggable={editable}
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
                        draggable={editable}
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
                        draggable={editable}
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
                        draggable={editable}
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
                return (
                    <Group
                        ref={setShapeRef}
                        x={annotation.x}
                        y={annotation.y}
                        rotation={annotation.rotation ?? 0}
                        visible={!editing}
                        listening={editable}
                        draggable={editable}
                        onClick={handleClick}
                        onDblClick={handleTextDblClick}
                        onDblTap={handleTextDblClick}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onTransform={handleTextTransform}
                        onTransformEnd={handleTransformEnd}
                    >
                        {/* Full-box hit target — Konva's <Text> hit-tests glyphs only, so clicks in empty space inside the box would miss. */}
                        <Rect
                            ref={textRectRef}
                            width={annotation.width ?? 0}
                            height={annotation.height ?? 0}
                            fill="rgba(0,0,0,0)"
                            fillEnabled
                            listening
                        />
                        <Text
                            ref={textNodeRef}
                            width={annotation.width ?? 0}
                            height={annotation.height ?? 0}
                            text={annotation.text ?? ""}
                            fontSize={annotation.fontSize ?? DEFAULT_TEXT_FONT_SIZE}
                            fontFamily={TEXT_FONT_FAMILY}
                            fontStyle={textFontStyle}
                            textDecoration={annotation.underline ? "underline" : ""}
                            fill={annotation.stroke}
                            align="left"
                            verticalAlign="top"
                            padding={TEXT_PADDING}
                            wrap="word"
                            listening={false}
                        />
                    </Group>
                );
        }
    };

    const showTransformer = selected && editable && !isCapturing && !isLineLike && !(isText && editing);
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
export const EditorAnnotation = memo(EditorAnnotationInner, (prev, next) => {
    return (
        prev.annotation === next.annotation &&
        prev.selected === next.selected &&
        prev.editable === next.editable &&
        prev.editing === next.editing
    );
});
