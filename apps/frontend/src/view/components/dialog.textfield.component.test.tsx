import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DialogTextField } from "./dialog.textfield.component";
import { renderWithProviders } from "../../test-utils/render-with-providers";

describe("DialogTextField", () => {
    it("should render a text input", () => {
        renderWithProviders(<DialogTextField />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with a label", () => {
        renderWithProviders(<DialogTextField label="Project name" />);
        expect(screen.getByLabelText("Project name")).toBeInTheDocument();
    });

    it("should render with a placeholder", () => {
        renderWithProviders(<DialogTextField placeholder="Enter name…" />);
        expect(screen.getByPlaceholderText("Enter name…")).toBeInTheDocument();
    });

    it("should call onChange when the user types", async () => {
        const handleChange = vi.fn();
        renderWithProviders(<DialogTextField onChange={handleChange} />);

        await userEvent.type(screen.getByRole("textbox"), "hello");

        expect(handleChange).toHaveBeenCalledTimes(5);
    });

    it("should render a multiline textarea when multiline is set", () => {
        renderWithProviders(<DialogTextField multiline rows={4} />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
        // MUI renders a <textarea> for multiline
        expect(document.querySelector("textarea")).toBeInTheDocument();
    });

    it("should display a helper text when provided", () => {
        renderWithProviders(<DialogTextField helperText="This field is required" />);
        expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should render as disabled when the disabled prop is set", () => {
        renderWithProviders(<DialogTextField disabled />);
        expect(screen.getByRole("textbox")).toBeDisabled();
    });
});
