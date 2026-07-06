import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import type { Component } from "#api/types/system.types.ts";
import { createComponentPayload } from "#test-utils/builders.ts";
import { useKeyboardComponentMove, type HelpLines } from "./use-keyboard-component-move.hook";

const makeComponent = (overrides: Partial<Component> = {}): Component =>
    ({
        ...createComponentPayload(),
        width: 80,
        height: 80,
        selected: true,
        ...overrides,
    }) as Component;

const makeKeyEvent = (key: string, target: EventTarget | null = null) =>
    ({
        key,
        target,
        preventDefault: vi.fn(),
    }) as unknown as KeyboardEvent & { preventDefault: ReturnType<typeof vi.fn> };

const setup = (overrides: Partial<Parameters<typeof useKeyboardComponentMove>[0]> = {}) => {
    const moveComponent = vi.fn();
    const updateConnectionsOfComponent = vi.fn();
    const setShowHelpLines = vi.fn();
    const currentHelpLinesRef: RefObject<HelpLines | null> = { current: null };

    const utils = renderHook((props: Partial<Parameters<typeof useKeyboardComponentMove>[0]>) =>
        useKeyboardComponentMove({
            selectedComponent: makeComponent({ x: 100, y: 100 }),
            isEditor: true,
            isAnyComponentInUse: false,
            layerPosition: { x: 0, y: 0 },
            gridSizeX: 20,
            gridSizeY: 20,
            currentHelpLinesRef,
            moveComponent,
            updateConnectionsOfComponent,
            setShowHelpLines,
            ...overrides,
            ...props,
        })
    );

    return { ...utils, moveComponent, updateConnectionsOfComponent, setShowHelpLines, currentHelpLinesRef };
};

describe("useKeyboardComponentMove", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    describe("handleKeyDown guards", () => {
        it("ignores non-arrow keys without moving or preventing default", () => {
            const { result, moveComponent, setShowHelpLines } = setup();
            const event = makeKeyEvent("Enter");

            act(() => {
                result.current.handleKeyDown(event);
            });

            expect(moveComponent).not.toHaveBeenCalled();
            expect(setShowHelpLines).not.toHaveBeenCalled();
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it.each(["INPUT", "TEXTAREA", "SELECT"])(
            "ignores arrow keys originating from a focused %s element",
            (tagName) => {
                const { result, moveComponent } = setup();
                const target = document.createElement(tagName.toLowerCase());
                const event = makeKeyEvent("ArrowUp", target);

                act(() => {
                    result.current.handleKeyDown(event);
                });

                expect(moveComponent).not.toHaveBeenCalled();
                expect(event.preventDefault).not.toHaveBeenCalled();
            }
        );

        it("ignores arrow keys originating from a contentEditable element", () => {
            const { result, moveComponent } = setup();
            const target = document.createElement("div");
            // jsdom does not derive isContentEditable from the attribute, so set it directly.
            Object.defineProperty(target, "isContentEditable", { value: true });
            const event = makeKeyEvent("ArrowUp", target);

            act(() => {
                result.current.handleKeyDown(event);
            });

            expect(moveComponent).not.toHaveBeenCalled();
        });

        it("does nothing when not in editor mode", () => {
            const { result, moveComponent } = setup({ isEditor: false });
            const event = makeKeyEvent("ArrowUp");

            act(() => {
                result.current.handleKeyDown(event);
            });

            expect(moveComponent).not.toHaveBeenCalled();
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it("does nothing when no component is selected", () => {
            const { result, moveComponent } = setup({ selectedComponent: undefined });
            const event = makeKeyEvent("ArrowUp");

            act(() => {
                result.current.handleKeyDown(event);
            });

            expect(moveComponent).not.toHaveBeenCalled();
        });
    });

    describe("nudging the selected component", () => {
        it.each([
            ["ArrowLeft", { x: 80, y: 100, gridX: 4, gridY: 5 }],
            ["ArrowRight", { x: 120, y: 100, gridX: 6, gridY: 5 }],
            ["ArrowUp", { x: 100, y: 80, gridX: 5, gridY: 4 }],
            ["ArrowDown", { x: 100, y: 120, gridX: 5, gridY: 6 }],
        ] as const)("moves the component one grid step on %s", (key, expected) => {
            const { result, moveComponent } = setup();
            const event = makeKeyEvent(key);

            act(() => {
                result.current.handleKeyDown(event);
            });

            expect(moveComponent).toHaveBeenCalledWith({
                id: "comp-1",
                ...expected,
            });
            expect(event.preventDefault).toHaveBeenCalledTimes(1);
        });

        it("floors the grid position toward negative infinity for negative coordinates", () => {
            const { result, moveComponent } = setup({ selectedComponent: makeComponent({ x: 10, y: 100 }) });

            act(() => {
                result.current.handleKeyDown(makeKeyEvent("ArrowLeft"));
            });

            // newx = 10 - 20 = -10; floor(-10 / 20) = -1 (not 0)
            expect(moveComponent).toHaveBeenCalledWith({
                id: "comp-1",
                x: -10,
                y: 100,
                gridX: -1,
                gridY: 5,
            });
        });

        it("shows the help lines and seeds their positions with the layer offset", () => {
            const { result, setShowHelpLines, currentHelpLinesRef } = setup({ layerPosition: { x: 30, y: 40 } });

            act(() => {
                result.current.handleKeyDown(makeKeyEvent("ArrowRight"));
            });

            // newx = 120, newy = 100
            expect(setShowHelpLines).toHaveBeenCalledWith(true);
            expect(currentHelpLinesRef.current).toEqual({
                x: 120 + 9 + 30,
                x2: 120 + 71 + 30,
                y: 100 + 9 + 40,
                y2: 100 + 71 + 40,
            });
        });
    });

    describe("deferred connection recalculation and help-line fade", () => {
        it("recalculates connections once after the settle delay, not on each keypress", () => {
            const { result, updateConnectionsOfComponent } = setup();

            act(() => {
                result.current.handleKeyDown(makeKeyEvent("ArrowRight"));
            });
            act(() => {
                vi.advanceTimersByTime(200);
            });
            // Second press before the first recalc fires resets the timer
            act(() => {
                result.current.handleKeyDown(makeKeyEvent("ArrowRight"));
            });
            act(() => {
                vi.advanceTimersByTime(200);
            });
            expect(updateConnectionsOfComponent).not.toHaveBeenCalled();

            act(() => {
                vi.advanceTimersByTime(50);
            });
            expect(updateConnectionsOfComponent).toHaveBeenCalledTimes(1);
        });

        it("hides the help lines after the fade delay when no drag is in progress", () => {
            const { result, setShowHelpLines } = setup({ isAnyComponentInUse: false });

            act(() => {
                result.current.handleKeyDown(makeKeyEvent("ArrowUp"));
            });
            act(() => {
                vi.advanceTimersByTime(900);
            });

            expect(setShowHelpLines).toHaveBeenCalledWith(false);
        });

        it("keeps the help lines when a mouse drag is still in progress", () => {
            const { result, setShowHelpLines } = setup({ isAnyComponentInUse: true });

            act(() => {
                result.current.handleKeyDown(makeKeyEvent("ArrowUp"));
            });
            act(() => {
                vi.advanceTimersByTime(900);
            });

            expect(setShowHelpLines).not.toHaveBeenCalledWith(false);
        });
    });

    describe("clearKeyboardNudgeTimeouts", () => {
        it("cancels the pending recalc and fade so neither fires", () => {
            const { result, updateConnectionsOfComponent, setShowHelpLines } = setup();

            act(() => {
                result.current.handleKeyDown(makeKeyEvent("ArrowUp"));
            });
            act(() => {
                result.current.clearKeyboardNudgeTimeouts();
            });
            act(() => {
                vi.advanceTimersByTime(2000);
            });

            expect(updateConnectionsOfComponent).not.toHaveBeenCalled();
            expect(setShowHelpLines).not.toHaveBeenCalledWith(false);
        });
    });

    describe("cleanup on unmount", () => {
        it("clears pending timers so no callback runs after unmount", () => {
            const { result, unmount, updateConnectionsOfComponent, setShowHelpLines } = setup();

            act(() => {
                result.current.handleKeyDown(makeKeyEvent("ArrowUp"));
            });
            unmount();
            act(() => {
                vi.advanceTimersByTime(2000);
            });

            expect(updateConnectionsOfComponent).not.toHaveBeenCalled();
            expect(setShowHelpLines).not.toHaveBeenCalledWith(false);
        });
    });
});
