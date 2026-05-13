import { Fragment, memo, useRef } from "react";
import { Group, Rect, Text, Transformer } from "react-konva";
import type { KonvaEventObject, Node as KonvaNode } from "konva/lib/Node";
import type { Rect as KonvaRectNode } from "konva/lib/shapes/Rect";
import type { Text as KonvaTextNode } from "konva/lib/shapes/Text";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useAnnotationInteraction } from "#application/hooks/use-annotation-interaction.hook.ts";
import { DEFAULT_TEXT_FONT_SIZE } from "#api/types/system.types.ts";
import type { AnnotationChanges, TextAnnotation } from "#api/types/system.types.ts";

const MIN_DIMENSION = 5;
const TEXT_PADDING = 4;
const TEXT_FONT_FAMILY = "Poppins, Roboto, sans-serif";

interface EditorTextAnnotationProps {
    annotation: TextAnnotation;
    selected: boolean;
    editable: boolean;
    editing: boolean;
    onSelect: (id: string, options?: { openSidebar?: boolean }) => void;
    onChange: (id: string, changes: AnnotationChanges) => void;
    onDragStateChange: ((isDragging: boolean) => void) | undefined;
    onRequestEdit: ((id: string) => void) | undefined;
}

const EditorTextAnnotationInner = ({
    annotation,
    selected,
    editable,
    editing,
    onSelect,
    onChange,
    onDragStateChange,
    onRequestEdit,
}: EditorTextAnnotationProps) => {
    const shapeRef = useRef<KonvaNode | null>(null);
    const textRectRef = useRef<KonvaRectNode | null>(null);
    const textNodeRef = useRef<KonvaTextNode | null>(null);
    const transformerRef = useRef<KonvaTransformer | null>(null);

    const setShapeRef = (node: KonvaNode | null): void => {
        shapeRef.current = node;
    };

    const { isCapturing, setStageCursor, handleClick, handleMouseEnter, handleMouseLeave } = useAnnotationInteraction({
        annotation,
        selected,
        editable,
        shapeRef,
        transformerRef,
        onSelect,
    });

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

    const handleDblClick = (event: KonvaEventObject<MouseEvent | TouchEvent>): void => {
        if (!editable) {
            return;
        }
        event.cancelBubble = true;
        event.evt.preventDefault();
        onRequestEdit?.(annotation.id);
    };

    const handleDragStart = (event: KonvaEventObject<DragEvent>): void => {
        setStageCursor(event, "move");
        onDragStateChange?.(true);
    };

    const handleDragEnd = (event: KonvaEventObject<DragEvent>): void => {
        setStageCursor(event, "default");
        onSelect(annotation.id, { openSidebar: false });
        onChange(annotation.id, { type: "text", x: event.target.x(), y: event.target.y() });
        onDragStateChange?.(false);
    };

    const handleTransform = (event: KonvaEventObject<Event>): void => {
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

    const handleTransformEnd = (event: KonvaEventObject<Event>): void => {
        const node = event.target;
        node.scaleX(1);
        node.scaleY(1);
        const rect = textRectRef.current;
        const dimensions = rect
            ? { width: Math.max(MIN_DIMENSION, rect.width()), height: Math.max(MIN_DIMENSION, rect.height()) }
            : {};
        onChange(annotation.id, {
            type: "text",
            x: node.x(),
            y: node.y(),
            rotation: node.rotation(),
            ...dimensions,
        });
    };

    const showTransformer = selected && editable && !isCapturing && !editing;

    return (
        <Fragment>
            <Group
                ref={setShapeRef}
                x={annotation.x}
                y={annotation.y}
                rotation={annotation.rotation ?? 0}
                visible={!editing}
                listening={editable}
                draggable={editable}
                onClick={handleClick}
                onDblClick={handleDblClick}
                onDblTap={handleDblClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTransform={handleTransform}
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
            {showTransformer && (
                <Transformer
                    ref={transformerRef}
                    flipEnabled={false}
                    rotateEnabled={true}
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

export const EditorTextAnnotation = memo(EditorTextAnnotationInner, (prev, next) => {
    return (
        prev.annotation === next.annotation &&
        prev.selected === next.selected &&
        prev.editable === next.editable &&
        prev.editing === next.editing
    );
});
