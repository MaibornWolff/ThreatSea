import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { konvaMock, konvaUtilsMock } from "#test-utils/konva-mock.ts";

vi.mock("react-konva", () => konvaMock());
vi.mock("react-konva-utils", () => konvaUtilsMock());

afterEach(() => {
    cleanup();
});
