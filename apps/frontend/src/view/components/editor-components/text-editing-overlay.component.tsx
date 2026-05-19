/**
 * TextEditingOverlay
 *
 * Single absolutely-positioned `<textarea>` portaled into <body> to edit a
 * text annotation. Inspired by the official Konva editable-text recipe but
 * kept in the React tree for refs/focus correctness.
 *
 * Keys: Enter inserts a newline. Commit happens on blur / outside-click;
 * Escape cancels.
 */
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import { DEFAULT_TEXT_FONT_SIZE, type Coordinate, type TextAnnotation } from "#api/types/system.types.ts";

const TEXT_PADDING = 4;
const OVERLAY_Z_INDEX = 1000;
const TEXT_FONT_FAMILY = "Poppins, Roboto, sans-serif";

// True when a click/focus lands somewhere we don't want to treat as "outside"
// the text edit — i.e. chrome that exists to style the annotation.
const isProtectedTarget = (target: Element): boolean => {
    if (target.closest("[data-edit-protected]")) {
        return true;
    }
    if (target.closest(".MuiPopover-root, .MuiModal-root, .MuiTooltip-popper")) {
        return true;
    }
    return false;
};

interface TextEditingOverlayProps {
    annotation: TextAnnotation;
    stageRef: React.RefObject<KonvaStage | null>;
    layerPosition: Coordinate;
    stageScale: number;
    stagePosition: Coordinate;
    onCommit: (text: string) => void;
    onCancel: () => void;
}

export const TextEditingOverlay = ({
    annotation,
    stageRef,
    layerPosition,
    stageScale,
    stagePosition,
    onCommit,
    onCancel,
}: TextEditingOverlayProps) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [value, setValue] = useState<string>(annotation.text);
    const sessionEndedRef = useRef(false);

    // Focus + select on mount
    const shouldSelectOnMount = useRef(annotation.text.length > 0);
    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            const textarea = textareaRef.current;
            if (!textarea) {
                return;
            }
            textarea.focus();
            if (shouldSelectOnMount.current) {
                textarea.select();
            }
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    const commit = (): void => {
        if (sessionEndedRef.current) {
            return;
        }
        sessionEndedRef.current = true;
        onCommit(textareaRef.current?.value ?? value);
    };

    const cancel = (): void => {
        if (sessionEndedRef.current) {
            return;
        }
        sessionEndedRef.current = true;
        onCancel();
    };

    // Outside-click commits. Capture phase so element-level handlers
    // (Konva mousedown preventDefault, MUI ripple) can't preempt us.
    useEffect(() => {
        const handleOutsideClick = (event: globalThis.MouseEvent): void => {
            const target = event.target as Node | null;
            if (textareaRef.current && target && textareaRef.current.contains(target)) {
                return;
            }
            if (target instanceof Element && isProtectedTarget(target)) {
                return;
            }
            commit();
        };
        const t = setTimeout(() => {
            window.addEventListener("mousedown", handleOutsideClick, true);
        }, 0);
        return () => {
            clearTimeout(t);
            window.removeEventListener("mousedown", handleOutsideClick, true);
        };
        // commit is stable for this mount thanks to sessionEndedRef.
        // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            cancel();
        }
    };

    const stage = stageRef.current;
    if (!stage) {
        return null;
    }
    const containerRect = stage.container().getBoundingClientRect();
    const stageX = stagePosition.x + (layerPosition.x + annotation.x) * stageScale;
    const stageY = stagePosition.y + (layerPosition.y + annotation.y) * stageScale;
    const screenX = containerRect.left + stageX;
    const screenY = containerRect.top + stageY;
    const width = annotation.width * stageScale;
    const height = annotation.height * stageScale;
    const fontSize = (annotation.fontSize ?? DEFAULT_TEXT_FONT_SIZE) * stageScale;

    const style: CSSProperties = {
        position: "fixed",
        top: `${screenY}px`,
        left: `${screenX}px`,
        width: `${width}px`,
        height: `${height}px`,
        fontSize: `${fontSize}px`,
        fontFamily: TEXT_FONT_FAMILY,
        fontStyle: annotation.italic ? "italic" : "normal",
        fontWeight: annotation.bold ? "bold" : "normal",
        textDecoration: annotation.underline ? "underline" : "none",
        color: annotation.stroke,
        padding: `${TEXT_PADDING}px`,
        margin: 0,
        border: "1px dashed rgba(35, 60, 87, 0.6)",
        outline: "none",
        background: "transparent",
        resize: "none",
        overflow: "hidden",
        boxSizing: "border-box",
        lineHeight: 1.2,
        zIndex: OVERLAY_Z_INDEX,
    };

    // Blur commits — except when focus moves to edit-protected
    const handleBlur = (event: FocusEvent<HTMLTextAreaElement>): void => {
        const next = event.relatedTarget;
        if (!(next instanceof Element)) {
            return;
        }
        if (isProtectedTarget(next)) {
            return;
        }
        commit();
    };

    return createPortal(
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            aria-label="Edit annotation text"
            style={style}
        />,
        document.body
    );
};
