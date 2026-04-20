/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ToggleButtonConfig } from "./toggle-buttons.component";

// Mock ToggleButtons to isolate MatrixFilterToggleButtonGroup's own behaviour
vi.mock("./toggle-buttons.component", () => ({
    ToggleButtons: ({
        buttons,
        value,
        onChange,
    }: {
        buttons: ToggleButtonConfig[];
        value?: string;
        onChange?: (e: React.SyntheticEvent, value: string) => void;
    }) => (
        <div data-testid="toggle-buttons" data-value={value}>
            {buttons.map((btn) => (
                <button key={String(btn.value)} onClick={(e) => onChange?.(e, String(btn.value))}>
                    {String(btn.value)}
                </button>
            ))}
        </div>
    ),
}));

import { MatrixFilterToggleButtonGroup } from "./matrix-filter-toggle-button-group.component";

const items: ToggleButtonConfig[] = [
    { value: "low", text: "Low" },
    { value: "medium", text: "Medium" },
    { value: "high", text: "High" },
];

describe("MatrixFilterToggleButtonGroup", () => {
    it("should render the ToggleButtons component", () => {
        render(<MatrixFilterToggleButtonGroup items={items} />);
        expect(screen.getByTestId("toggle-buttons")).toBeInTheDocument();
    });

    it("should pass all items to ToggleButtons as buttons", () => {
        render(<MatrixFilterToggleButtonGroup items={items} />);
        expect(screen.getByText("low")).toBeInTheDocument();
        expect(screen.getByText("medium")).toBeInTheDocument();
        expect(screen.getByText("high")).toBeInTheDocument();
    });

    it("should forward the current value to ToggleButtons", () => {
        render(<MatrixFilterToggleButtonGroup items={items} value="medium" />);
        expect(screen.getByTestId("toggle-buttons")).toHaveAttribute("data-value", "medium");
    });

    it("should call onChange when a toggle button is clicked", async () => {
        const handleChange = vi.fn();
        render(<MatrixFilterToggleButtonGroup items={items} onChange={handleChange} />);

        await userEvent.click(screen.getByText("high"));

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(expect.anything(), "high");
    });
});
