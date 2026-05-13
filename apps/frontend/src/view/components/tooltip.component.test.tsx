import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "./tooltip.component";
import { renderWithProviders } from "../../test-utils/render-with-providers";

// MUI's styled Tooltip clones the child element and sets aria-label on the
// clone equal to the tooltip title. This means the button's accessible name
// becomes the tooltip title, not its text content. We therefore query by text
// content rather than by role + name.

describe("Tooltip", () => {
    it("should render its children", () => {
        renderWithProviders(
            <Tooltip title="Hint text">
                <button>Hover me</button>
            </Tooltip>
        );
        // The cloned button has aria-label="Hint text"; query by text content instead.
        expect(screen.getByText("Hover me")).toBeInTheDocument();
    });

    it("should not show a tooltip before hovering", () => {
        renderWithProviders(
            <Tooltip title="Helpful hint">
                <button>Target</button>
            </Tooltip>
        );

        // No tooltip should be present before any interaction.
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("should show the tooltip text on hover", async () => {
        renderWithProviders(
            <Tooltip title="Helpful hint">
                <button>Target</button>
            </Tooltip>
        );

        // MUI sets aria-label on the clone, so query by text content.
        await userEvent.hover(screen.getByText("Target"));

        expect(await screen.findByRole("tooltip", { name: "Helpful hint" })).toBeInTheDocument();
    });

    it("should not show a tooltip when title is empty", async () => {
        renderWithProviders(
            <Tooltip title="">
                <button>No tip</button>
            </Tooltip>
        );

        await userEvent.hover(screen.getByText("No tip"));

        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
});
