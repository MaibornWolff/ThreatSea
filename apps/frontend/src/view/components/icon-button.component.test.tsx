import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconButton } from "./icon-button.component";
import { Star } from "@mui/icons-material";
import { renderWithProviders } from "../../test-utils/render-with-providers";

describe("IconButton", () => {
    it("should render its children", () => {
        renderWithProviders(
            <IconButton>
                <Star data-testid="star-icon" />
            </IconButton>
        );
        expect(screen.getByTestId("star-icon")).toBeInTheDocument();
    });

    it("should render without a tooltip when no title is provided", () => {
        renderWithProviders(
            <IconButton>
                <Star />
            </IconButton>
        );
        // Only the button itself — no tooltip role
        expect(screen.getByRole("button")).toBeInTheDocument();
        expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("should wrap the button in a Tooltip when a title is provided", async () => {
        renderWithProviders(
            <IconButton title="Delete item">
                <Star />
            </IconButton>
        );

        await userEvent.hover(screen.getByRole("button"));

        expect(await screen.findByRole("tooltip", { name: "Delete item" })).toBeInTheDocument();
    });

    it("should call onClick when clicked", async () => {
        const handleClick = vi.fn();
        renderWithProviders(
            <IconButton onClick={handleClick}>
                <Star />
            </IconButton>
        );

        await userEvent.click(screen.getByRole("button"));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when the disabled prop is set", () => {
        renderWithProviders(
            <IconButton disabled>
                <Star />
            </IconButton>
        );
        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should not call onClick when disabled", async () => {
        const handleClick = vi.fn();
        renderWithProviders(
            <IconButton disabled onClick={handleClick}>
                <Star />
            </IconButton>
        );

        await userEvent.click(screen.getByRole("button"), { pointerEventsCheck: 0 });

        expect(handleClick).not.toHaveBeenCalled();
    });
});
