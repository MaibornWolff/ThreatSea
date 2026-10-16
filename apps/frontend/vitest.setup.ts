import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { konvaMock, konvaTestControls, konvaUtilsMock } from "#test-utils/konva-mock.ts";

vi.mock("react-konva", () => konvaMock());
vi.mock("react-konva-utils", () => konvaUtilsMock());

const ensureAnimationFrameGlobals = (): void => {
    const scope = globalThis as typeof globalThis & {
        requestAnimationFrame: (callback: (time: number) => void) => number;
        cancelAnimationFrame: (id: number) => void;
    };
    if (typeof scope.requestAnimationFrame !== "function") {
        scope.requestAnimationFrame = (callback) =>
            setTimeout(() => callback(performance.now()), 0) as unknown as number;
    }
    if (typeof scope.cancelAnimationFrame !== "function") {
        scope.cancelAnimationFrame = (id) => clearTimeout(id);
    }
};
ensureAnimationFrameGlobals();

const ensureResizeObserver = (): void => {
    const scope = globalThis as typeof globalThis & { ResizeObserver?: unknown };
    if (typeof scope.ResizeObserver !== "function") {
        scope.ResizeObserver = class {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = vi.fn();
        };
    }
};
ensureResizeObserver();

// jsdom stores `window.onkeyup = handler` but never calls it for dispatched events; only
// addEventListener listeners fire. EditorStage registers its keyboard handlers that way, so
// bridge the two properties. Feature-detected so a jsdom that wires them up runs them once.
const ensureWindowKeyHandlerProperties = (): void => {
    type KeyHandler = ((event: unknown) => void) | null;
    const browserWindow = (
        globalThis as unknown as {
            window: {
                onkeyup: KeyHandler;
                onkeydown: KeyHandler;
                addEventListener: (type: string, listener: (event: unknown) => void) => void;
                dispatchEvent: (event: unknown) => boolean;
            };
        }
    ).window;
    const { KeyboardEvent } = globalThis as unknown as { KeyboardEvent: new (type: string) => unknown };

    let calledByJsdom = false;
    browserWindow.onkeyup = () => {
        calledByJsdom = true;
    };
    browserWindow.dispatchEvent(new KeyboardEvent("keyup"));
    browserWindow.onkeyup = null;
    if (calledByJsdom) {
        return;
    }
    browserWindow.addEventListener("keyup", (event) => browserWindow.onkeyup?.call(browserWindow, event));
    browserWindow.addEventListener("keydown", (event) => browserWindow.onkeydown?.call(browserWindow, event));
};
ensureWindowKeyHandlerProperties();

afterEach(() => {
    cleanup();
    konvaTestControls.reset();
    ensureAnimationFrameGlobals();
});
