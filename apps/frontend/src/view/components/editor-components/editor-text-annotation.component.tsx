import { Fragment, memo, useRef, useState } from "react";
import { Group, Rect, Text, Transformer } from "react-konva";
import { Html, type HtmlTransformAttrs } from "react-konva-utils";
import type { KonvaEventObject, Node as KonvaNode } from "konva/lib/Node";
import type { Rect as KonvaRectNode } from "konva/lib/shapes/Rect";
import type { Text as KonvaTextNode } from "konva/lib/shapes/Text";
import type { Transformer as KonvaTransformer } from "konva/lib/shapes/Transformer";
import { useAnnotationInteraction } from "#application/hooks/use-annotation-interaction.hook.ts";
import { useTextEdit } from "#application/hooks/use-text-edit.hook.ts";
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
    stageScale: number;
    onSelect: (id: string, options?: { openSidebar?: boolean }) => void;
    onChange: (id: string, changes: AnnotationChanges) => void;
    onDragStateChange: ((isDragging: boolean) => void) | undefined;
    onRequestEdit: ((id: string) => void) | undefined;
    onExitEdit?: ((id: string) => void) | undefined;
}
const stripHtmlScale = (attrs: HtmlTransformAttrs): HtmlTransformAttrs => ({
    ...attrs,
    x: Math.round(attrs.x),
    y: Math.round(attrs.y),
    scaleX: 1,
    scaleY: 1,
});

const EditorTextAnnotationInner = ({
    annotation,
    selected,
    editable,
    editing,
    stageScale,
    onSelect,
    onChange,
    onDragStateChange,
    onRequestEdit,
    onExitEdit,
}: EditorTextAnnotationProps) => {
    const shapeRef = useRef<KonvaNode | null>(null);
    const textRectRef = useRef<KonvaRectNode | null>(null);
    const textNodeRef = useRef<KonvaTextNode | null>(null);
    const transformerRef = useRef<KonvaTransformer | null>(null);

    const setShapeRef = (node: KonvaNode | null): void => {
        shapeRef.current = node;
    };

    const [isDragging, setIsDragging] = useState(false);
    const { isCapturing, isDrawing, setStageCursor, handleMouseEnter, handleMouseLeave } = useAnnotationInteraction({
        annotation,
        selected,
        editable,
        shapeRef,
        transformerRef,
        onSelect,
    });

    const textEdit = useTextEdit({
        editing,
        onTextChange: (text) => onChange(annotation.id, { type: "text", text }),
        onExit: () => onExitEdit?.(annotation.id),
    });

    // First click selects, second click on the same text enters edit mode.
    const handleClick = (event: KonvaEventObject<MouseEvent>): void => {
        if (event.evt.button !== 0) {
            return;
        }
        if (isDrawing) {
            return;
        }
        event.cancelBubble = true;
        event.evt.preventDefault();
        if (!selected) {
            onSelect(annotation.id);
            return;
        }
        if (!editing) {
            onRequestEdit?.(annotation.id);
        }
    };

    const handleDblClick = (event: KonvaEventObject<MouseEvent | TouchEvent>): void => {
        if (!editable) {
            return;
        }
        event.cancelBubble = true;
        event.evt.preventDefault();
        onRequestEdit?.(annotation.id);
    };

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

    const handleDragStart = (event: KonvaEventObject<DragEvent>): void => {
        setStageCursor(event, "move");
        setIsDragging(true);
        onDragStateChange?.(true);
    };

    const handleDragEnd = (event: KonvaEventObject<DragEvent>): void => {
        setStageCursor(event, "default");
        setIsDragging(false);
        onSelect(annotation.id, { openSidebar: false });
        onChange(annotation.id, { type: "text", x: event.target.x(), y: event.target.y() });
        onDragStateChange?.(false);
    };

    const handleTransform = (event: KonvaEventObject<Event>): void => {
        // Apply scale to width/height and reset to 1 so it doesn't accumulate.
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const rect = textRectRef.current;
        if (!rect) {
            return;
        }
        const newWidth = Math.max(MIN_DIMENSION, rect.width() * scaleX);
        const newHeight = Math.max(MIN_DIMENSION, rect.height() * scaleY);
        rect.width(newWidth);
        rect.height(newHeight);
        const text = textNodeRef.current;
        if (text) {
            text.width(newWidth);
            text.height(newHeight);
        }
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

    const showTransformer = selected && editable && !isCapturing && !isDragging;

    return (
        <Fragment>
            <Group
                ref={setShapeRef}
                x={annotation.x}
                y={annotation.y}
                rotation={annotation.rotation ?? 0}
                listening={editable}
                draggable={editable && !isDrawing && !editing}
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
                <Rect
                    ref={textRectRef}
                    width={annotation.width ?? 0}
                    height={annotation.height ?? 0}
                    fill="rgba(0,0,0,0)"
                    fillEnabled
                    listening={!editing}
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
                    lineHeight={1.2}
                    wrap="word"
                    listening={false}
                    visible={!editing || isCapturing}
                />
                <Html
                    groupProps={{ x: 0, y: 0 }}
                    transformFunc={stripHtmlScale}
                    // Outer wrapper passes clicks through to Konva when not editing;
                    divProps={{
                        style: {
                            pointerEvents: editing ? "auto" : "none",
                            opacity: editing ? 1 : 0,
                        },
                    }}
                >
                    <textarea
                        ref={textEdit.ref}
                        value={annotation.text ?? ""}
                        readOnly={!editing}
                        onChange={textEdit.onChange}
                        onBlur={textEdit.onBlur}
                        onKeyDown={textEdit.onKeyDown}
                        spellCheck={false}
                        style={{
                            display: "block",
                            verticalAlign: "top",
                            width: `${(annotation.width ?? 0) * stageScale}px`,
                            height: `${(annotation.height ?? 0) * stageScale}px`,
                            fontSize: `${(annotation.fontSize ?? DEFAULT_TEXT_FONT_SIZE) * stageScale}px`,
                            fontFamily: TEXT_FONT_FAMILY,
                            fontStyle: annotation.italic ? "italic" : "normal",
                            fontWeight: annotation.bold ? "bold" : "normal",
                            textDecoration: annotation.underline ? "underline" : "none",
                            color: annotation.stroke,
                            padding: `${TEXT_PADDING * stageScale}px`,
                            margin: 0,
                            boxSizing: "border-box",
                            border: "none",
                            outline: "none",
                            background: "transparent",
                            resize: "none",
                            lineHeight: 1.2,
                            WebkitFontSmoothing: "antialiased",
                            MozOsxFontSmoothing: "grayscale",
                            transform: "translateZ(0)",
                            willChange: editing ? "transform" : "auto",
                            cursor: editing ? "text" : "default",
                            userSelect: editing ? "text" : "none",
                            overflow: "hidden",
                        }}
                    />
                </Html>
            </Group>
            <Transformer
                ref={transformerRef}
                visible={showTransformer}
                flipEnabled={false}
                rotateEnabled={true}
                rotateAnchorOffset={20}
                boundBoxFunc={(oldBox, newBox) => {
                    if (Math.abs(newBox.width) < MIN_DIMENSION || Math.abs(newBox.height) < MIN_DIMENSION) {
                        return oldBox;
                    }
                    return newBox;
                }}
            />
        </Fragment>
    );
};

export const EditorTextAnnotation = memo(EditorTextAnnotationInner, (prev, next) => {
    return (
        prev.annotation === next.annotation &&
        prev.selected === next.selected &&
        prev.editable === next.editable &&
        prev.editing === next.editing &&
        prev.stageScale === next.stageScale
    );
});
