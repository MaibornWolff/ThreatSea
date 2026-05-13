import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportIconButton } from "./export-icon-button.component";
import { renderWithProviders } from "../../test-utils/render-with-providers";

describe("ExportIconButton", () => {
    it("should render a button", () => {
        renderWithProviders(<ExportIconButton />);
        expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should render the FileDownload icon", () => {
        renderWithProviders(<ExportIconButton />);
        // MUI renders the icon as an SVG inside the button
        expect(screen.getByRole("button").querySelector("svg")).toBeInTheDocument();
    });

    it("should show a tooltip when a title is provided", async () => {
        renderWithProviders(<ExportIconButton title="Export data" />);

        await userEvent.hover(screen.getByRole("button"));

        expect(await screen.findByRole("tooltip", { name: "Export data" })).toBeInTheDocument();
    });

    it("should call onClick when clicked", async () => {
        const handleClick = vi.fn();
        renderWithProviders(<ExportIconButton onClick={handleClick} />);

        await userEvent.click(screen.getByRole("button"));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when the disabled prop is set", () => {
        renderWithProviders(<ExportIconButton disabled />);
        expect(screen.getByRole("button")).toBeDisabled();
    });
});
