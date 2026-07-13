import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { Component, Coordinate } from "#api/types/system.types.ts";

export interface HelpLines {
    x: number;
    y: number;
    x2: number;
    y2: number;
}

interface UseKeyboardComponentMoveArgs {
    selectedComponent: Component | undefined;
    isEditor: boolean;
    isAnyComponentInUse: boolean;
    layerPosition: Coordinate;
    gridSizeX: number;
    gridSizeY: number;
    currentHelpLinesRef: RefObject<HelpLines | null>;
    moveComponent: (component: Pick<Component, "id" | "x" | "y" | "gridX" | "gridY">) => void;
    updateConnectionsOfComponent: () => void;
    setShowHelpLines: (value: boolean) => void;
}

// True when a keyboard event originated from a focused text input, so arrow-key
// nudging is skipped while the user is typing in a field.
const isEditableEventTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    if (target.isContentEditable) {
        return true;
    }
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

export const useKeyboardComponentMove = ({
    selectedComponent,
    isEditor,
    isAnyComponentInUse,
    layerPosition,
    gridSizeX,
    gridSizeY,
    currentHelpLinesRef,
    moveComponent,
    updateConnectionsOfComponent,
    setShowHelpLines,
}: UseKeyboardComponentMoveArgs) => {
    const keyboardRecalcTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const helpLineHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isAnyComponentInUseRef = useRef(false);

    const clearKeyboardNudgeTimeouts = useCallback((): void => {
        if (keyboardRecalcTimeoutRef.current) {
            clearTimeout(keyboardRecalcTimeoutRef.current);
            keyboardRecalcTimeoutRef.current = null;
        }
        if (helpLineHideTimeoutRef.current) {
            clearTimeout(helpLineHideTimeoutRef.current);
            helpLineHideTimeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        isAnyComponentInUseRef.current = isAnyComponentInUse;
    }, [isAnyComponentInUse]);

    useEffect(() => {
        return () => {
            clearKeyboardNudgeTimeouts();
        };
    }, [clearKeyboardNudgeTimeouts]);

    const handleKeyDown = (event: KeyboardEvent): void => {
        const { key } = event;
        const isArrowKey = key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight";
        if (!isArrowKey) {
            return;
        }

        // Skip when the keystroke came from an editable field or the user cannot edit.
        if (isEditableEventTarget(event.target)) {
            return;
        }
        if (!isEditor || selectedComponent == null) {
            return;
        }

        // Keep the arrow key from scrolling the page while nudging a component.
        event.preventDefault();

        const deltaX = key === "ArrowLeft" ? -gridSizeX : key === "ArrowRight" ? gridSizeX : 0;
        const deltaY = key === "ArrowUp" ? -gridSizeY : key === "ArrowDown" ? gridSizeY : 0;

        const newx = selectedComponent.x + deltaX;
        const newy = selectedComponent.y + deltaY;
        const gridPositionX = Math.floor(newx / gridSizeX);
        const gridPositionY = Math.floor(newy / gridSizeY);

        moveComponent({
            id: selectedComponent.id,
            x: newx,
            y: newy,
            gridX: gridPositionX,
            gridY: gridPositionY,
        });

        currentHelpLinesRef.current = {
            x: newx + 9 + layerPosition.x,
            x2: newx + 71 + layerPosition.x,
            y: newy + 9 + layerPosition.y,
            y2: newy + 71 + layerPosition.y,
        };
        setShowHelpLines(true);

        // Recalculating connection routing is expensive, so defer it until the nudging
        // settles instead of rerouting on every keypress (mirrors how drag recalcs once
        // at drag-end).
        clearKeyboardNudgeTimeouts();
        keyboardRecalcTimeoutRef.current = setTimeout(() => {
            updateConnectionsOfComponent();
        }, 250);
        helpLineHideTimeoutRef.current = setTimeout(() => {
            if (!isAnyComponentInUseRef.current) {
                setShowHelpLines(false);
            }
        }, 900);
    };

    return { handleKeyDown, clearKeyboardNudgeTimeouts };
};
