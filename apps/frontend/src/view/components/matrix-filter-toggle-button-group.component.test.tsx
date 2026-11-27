import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ToggleButtonConfig } from "./toggle-buttons.component";
import { MatrixFilterToggleButtonGroup } from "./matrix-filter-toggle-button-group.component";

// Renders the real ToggleButtons: the frontend suite runs with `isolate: false`, so a vi.mock of it
// is skipped whenever an earlier test file has already loaded the real component.

const items: ToggleButtonConfig[] = [
    { value: "low", text: "Low" },
    { value: "medium", text: "Medium" },
    { value: "high", text: "High" },
];

describe("MatrixFilterToggleButtonGroup", () => {
    it("should render a button for every item", () => {
        render(<MatrixFilterToggleButtonGroup items={items} />);

        expect(screen.getAllByRole("button").map((button) => button.textContent)).toEqual(["Low", "Medium", "High"]);
    });

    it("should mark only the button of the current value as pressed", () => {
        render(<MatrixFilterToggleButtonGroup items={items} value="medium" />);

        expect(screen.getByRole("button", { name: "Medium" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: "Low" })).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByRole("button", { name: "High" })).toHaveAttribute("aria-pressed", "false");
    });

    it("should mark no button as pressed without a value", () => {
        render(<MatrixFilterToggleButtonGroup items={items} />);

        for (const button of screen.getAllByRole("button")) {
            expect(button).toHaveAttribute("aria-pressed", "false");
        }
    });

    it("should call onChange with the value of the clicked button", async () => {
        const handleChange = vi.fn();
        render(<MatrixFilterToggleButtonGroup items={items} onChange={handleChange} />);

        await userEvent.click(screen.getByRole("button", { name: "High" }));

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(expect.anything(), "high");
    });

    it("should call onChange with null when the pressed button is clicked again", async () => {
        const handleChange = vi.fn();
        render(<MatrixFilterToggleButtonGroup items={items} value="high" onChange={handleChange} />);

        await userEvent.click(screen.getByRole("button", { name: "High" }));

        expect(handleChange).toHaveBeenCalledWith(expect.anything(), null);
    });
});
