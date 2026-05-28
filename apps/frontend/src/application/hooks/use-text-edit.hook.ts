import { useCallback, useEffect, useRef, type ChangeEvent, type FocusEvent, type KeyboardEvent } from "react";

const isProtectedTarget = (target: Element): boolean => {
    if (target.closest("[data-edit-protected]")) {
        return true;
    }
    if (target.closest(".MuiPopover-root, .MuiModal-root, .MuiTooltip-popper")) {
        return true;
    }
    return false;
};

interface UseTextEditArgs {
    editing: boolean;
    onTextChange: (text: string) => void;
    onExit: () => void;
}

interface UseTextEditResult {
    ref: (node: HTMLTextAreaElement | null) => void;
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur: (event: FocusEvent<HTMLTextAreaElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const useTextEdit = ({ editing, onTextChange, onExit }: UseTextEditArgs): UseTextEditResult => {
    const elementRef = useRef<HTMLTextAreaElement | null>(null);

    // Defer focus by one frame so we run after the mouse-event chain that
    // triggered the edit-mode toggle (otherwise the canvas/stage can steal focus).
    useEffect(() => {
        if (!editing) {
            return;
        }
        const animationFrameId = requestAnimationFrame(() => {
            const element = elementRef.current;
            if (!element) {
                return;
            }
            element.focus();
            const end = element.value.length;
            element.setSelectionRange(end, end);
        });
        return () => cancelAnimationFrame(animationFrameId);
    }, [editing]);

    const setRef = useCallback((node: HTMLTextAreaElement | null): void => {
        elementRef.current = node;
    }, []);

    const onChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
        onTextChange(event.currentTarget.value);
    };

    const onBlur = (event: FocusEvent<HTMLTextAreaElement>): void => {
        if (!editing) {
            return;
        }
        const next = event.relatedTarget;
        if (next instanceof Element && isProtectedTarget(next)) {
            requestAnimationFrame(() => elementRef.current?.focus());
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
        if (event.key === "Escape") {
            event.preventDefault();
            onExit();
            return;
        }
        if (event.key === "Enter") {
            event.stopPropagation();
        }
    };

    return { ref: setRef, onChange, onBlur, onKeyDown };
};
