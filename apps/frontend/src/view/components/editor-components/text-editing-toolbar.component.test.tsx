import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextEditingToolbar } from "./text-editing-toolbar.component";
import { createAnnotation } from "#test-utils/builders.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import type { TextAnnotation } from "#api/types/system.types.ts";

const setup = (overrides: Partial<TextAnnotation> = {}) => {
    const annotation = createAnnotation({ type: "text", ...overrides });
    const onChange = vi.fn();
    const onColorChange = vi.fn();
    const onColorPreview = vi.fn();
    const onDelete = vi.fn();
    renderWithProviders(
        <TextEditingToolbar
            annotation={annotation}
            onChange={onChange}
            onColorChange={onColorChange}
            onColorPreview={onColorPreview}
            onDelete={onDelete}
        />
    );
    return { annotation, onChange, onColorChange, onColorPreview, onDelete };
};

describe("TextEditingToolbar", () => {
    it("renders inside a data-edit-protected root so clicks on it don't commit the text edit", () => {
        const { container } = renderWithProviders(
            <TextEditingToolbar
                annotation={createAnnotation({ type: "text" })}
                onChange={vi.fn()}
                onColorChange={vi.fn()}
                onDelete={vi.fn()}
            />
        );
        expect(container.querySelector("[data-edit-protected]")).not.toBeNull();
    });

    it("invokes onDelete when the delete button is clicked", async () => {
        const user = userEvent.setup();
        const { onDelete } = setup();

        await user.click(screen.getByRole("button", { name: "Delete annotation" }));

        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("toggles bold via onChange when the bold button is clicked", async () => {
        const user = userEvent.setup();
        const { onChange } = setup({ bold: false });

        await user.click(screen.getByRole("button", { name: "Bold" }));

        expect(onChange).toHaveBeenCalledWith({ type: "text", bold: true });
    });

    it("toggles italic via onChange (inverting the current value)", async () => {
        const user = userEvent.setup();
        const { onChange } = setup({ italic: true });

        await user.click(screen.getByRole("button", { name: "Italic" }));

        expect(onChange).toHaveBeenCalledWith({ type: "text", italic: false });
    });

    it("toggles underline via onChange", async () => {
        const user = userEvent.setup();
        const { onChange } = setup({ underline: false });

        await user.click(screen.getByRole("button", { name: "Underline" }));

        expect(onChange).toHaveBeenCalledWith({ type: "text", underline: true });
    });

    it("dispatches the new fontSize when the font-size dropdown is changed", async () => {
        const user = userEvent.setup();
        const { onChange } = setup({ fontSize: 16 });

        await user.click(screen.getByRole("combobox", { name: "Font size" }));
        await user.click(screen.getByRole("option", { name: "24" }));

        expect(onChange).toHaveBeenCalledWith({ type: "text", fontSize: 24 });
    });

    it("forwards a color preset click to onColorChange", async () => {
        const user = userEvent.setup();
        const { onColorChange } = setup();
        // Black differs from the default builder stroke ("#5786ff"), so click surfaces a change.
        await user.click(screen.getByRole("button", { name: "#000000" }));

        expect(onColorChange).toHaveBeenCalledWith("#000000");
    });

    it("reflects active formatting via aria-pressed on the toggle buttons", () => {
        setup({ bold: true, italic: false, underline: true });

        expect(screen.getByRole("button", { name: "Bold" })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: "Italic" })).toHaveAttribute("aria-pressed", "false");
        expect(screen.getByRole("button", { name: "Underline" })).toHaveAttribute("aria-pressed", "true");
    });
});
