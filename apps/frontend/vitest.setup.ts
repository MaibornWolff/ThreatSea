import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { konvaMock } from "#test-utils/konva-mock.ts";

vi.mock("react-konva", () => konvaMock());

afterEach(() => {
    cleanup();
});
