import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DialogTextField } from "./dialog.textfield.component";

describe("DialogTextField", () => {
    it("should render a text input", () => {
        render(<DialogTextField />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with a label", () => {
        render(<DialogTextField label="Project name" />);
        expect(screen.getByLabelText("Project name")).toBeInTheDocument();
    });

    it("should render with a placeholder", () => {
        render(<DialogTextField placeholder="Enter name…" />);
        expect(screen.getByPlaceholderText("Enter name…")).toBeInTheDocument();
    });

    it("should call onChange when the user types", async () => {
        const handleChange = vi.fn();
        render(<DialogTextField onChange={handleChange} />);

        await userEvent.type(screen.getByRole("textbox"), "hello");

        expect(handleChange).toHaveBeenCalledTimes(5);
    });

    it("should render a multiline textarea when multiline is set", () => {
        render(<DialogTextField multiline rows={4} />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
        // MUI renders a <textarea> for multiline
        expect(document.querySelector("textarea")).toBeInTheDocument();
    });

    it("should display a helper text when provided", () => {
        render(<DialogTextField helperText="This field is required" />);
        expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should render as disabled when the disabled prop is set", () => {
        render(<DialogTextField disabled />);
        expect(screen.getByRole("textbox")).toBeDisabled();
    });
});
