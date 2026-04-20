/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToggleButtons } from "./toggle-buttons.component";
import type { ToggleButtonConfig } from "./toggle-buttons.component";
import { Star, Favorite } from "@mui/icons-material";

const textButtons: ToggleButtonConfig[] = [
    { value: "option-a", text: "Option A" },
    { value: "option-b", text: "Option B" },
    { value: "option-c", text: "Option C" },
];

const iconButtons: ToggleButtonConfig[] = [
    { value: "star", icon: Star, "data-testid": "btn-star" },
    { value: "fav", icon: Favorite, "data-testid": "btn-fav" },
];

describe("ToggleButtons", () => {
    it("should render one button per config entry", () => {
        render(<ToggleButtons buttons={textButtons} />);
        expect(screen.getAllByRole("button")).toHaveLength(3);
    });

    it("should render the text label for each button", () => {
        render(<ToggleButtons buttons={textButtons} />);
        expect(screen.getByText("Option A")).toBeInTheDocument();
        expect(screen.getByText("Option B")).toBeInTheDocument();
        expect(screen.getByText("Option C")).toBeInTheDocument();
    });

    it("should render icon buttons when an icon is provided", () => {
        render(<ToggleButtons buttons={iconButtons} />);
        // MUI ToggleButton renders as role="button"
        expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("should call onChange with the selected value when a button is clicked", async () => {
        const handleChange = vi.fn();
        render(<ToggleButtons buttons={textButtons} onChange={handleChange} />);

        await userEvent.click(screen.getByText("Option B"));

        expect(handleChange).toHaveBeenCalledTimes(1);
        // MUI passes (event, value) to onChange
        expect(handleChange).toHaveBeenCalledWith(expect.anything(), "option-b");
    });

    it("should mark the button matching the value prop as selected", () => {
        render(<ToggleButtons buttons={textButtons} value="option-a" />);
        const selectedButton = screen.getByText("Option A").closest("button");
        expect(selectedButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should render nothing when the buttons array is empty", () => {
        render(<ToggleButtons buttons={[]} />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
