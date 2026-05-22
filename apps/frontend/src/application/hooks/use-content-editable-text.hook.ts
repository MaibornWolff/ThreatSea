import { useCallback, useEffect, useRef, type FocusEvent, type KeyboardEvent, type SyntheticEvent } from "react";

// Surfaces a blur/click on must not exit edit mode (toolbar, MUI popovers).
const isProtectedTarget = (target: Element): boolean => {
    if (target.closest("[data-edit-protected]")) {
        return true;
    }
    if (target.closest(".MuiPopover-root, .MuiModal-root, .MuiTooltip-popper")) {
        return true;
    }
    return false;
};

interface UseContentEditableTextArgs {
    text: string;
    editing: boolean;
    onTextChange: (text: string) => void;
    onExit: () => void;
}

interface UseContentEditableTextResult {
    setRef: (node: HTMLDivElement | null) => void;
    onInput: (event: SyntheticEvent<HTMLDivElement>) => void;
    onBlur: (event: FocusEvent<HTMLDivElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

// Owns the lifecycle of a contentEditable div: initial content seed without
// React reconciling against the DOM (which would clobber the caret), focus +
// caret-at-end on edit-mode entry, and external text sync while not editing.
export const useContentEditableText = ({
    text,
    editing,
    onTextChange,
    onExit,
}: UseContentEditableTextArgs): UseContentEditableTextResult => {
    const ref = useRef<HTMLDivElement | null>(null);

    // rAF lets the freshly-toggled contentEditable reach the DOM before focus.
    useEffect(() => {
        if (!editing) {
            return;
        }
        const animationFrameId = requestAnimationFrame(() => {
            const element = ref.current;
            if (!element) {
                return;
            }
            element.focus();
            const range = document.createRange();
            range.selectNodeContents(element);
            range.collapse(false);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        });
        return () => cancelAnimationFrame(animationFrameId);
    }, [editing]);

    // Seed initial content via ref callback, not JSX children — React would
    // reconcile JSX text on every keystroke and clobber the caret.
    const hasInitializedRef = useRef(false);
    const initialTextRef = useRef(text);
    const setRef = useCallback((node: HTMLDivElement | null): void => {
        ref.current = node;
        if (node && !hasInitializedRef.current) {
            node.textContent = initialTextRef.current;
            hasInitializedRef.current = true;
        }
    }, []);

    // Sync external text changes; skip during edit to preserve the caret.
    useEffect(() => {
        if (editing) {
            return;
        }
        const element = ref.current;
        if (element && element.textContent !== text) {
            element.textContent = text;
        }
    }, [text, editing]);

    const onInput = (event: SyntheticEvent<HTMLDivElement>): void => {
        // innerText (not textContent) — converts native <br> line breaks to "\n".
        onTextChange(event.currentTarget.innerText ?? "");
    };

    const onBlur = (event: FocusEvent<HTMLDivElement>): void => {
        if (!editing) {
            return;
        }
        const next = event.relatedTarget;
        if (next instanceof Element && isProtectedTarget(next)) {
            requestAnimationFrame(() => ref.current?.focus());
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            onExit();
            return;
        }
        // Stop Enter from reaching the page-level Konva shortcut handler;
        // let the browser do its native <br>/<div> line-break insertion.
        if (event.key === "Enter") {
            event.stopPropagation();
        }
    };

    return { setRef, onInput, onBlur, onKeyDown };
};
