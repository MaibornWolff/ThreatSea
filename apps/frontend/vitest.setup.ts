import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { konvaMock, konvaUtilsMock } from "#test-utils/konva-mock.ts";

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

afterEach(() => {
    cleanup();
    ensureAnimationFrameGlobals();
});
