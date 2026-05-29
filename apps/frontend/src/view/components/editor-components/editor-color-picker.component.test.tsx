import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorColorPicker } from "./editor-color-picker.component";
import { DEFAULT_ANNOTATION_COLOR } from "#view/colors/annotation.colors.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";

const PRESET_COLORS = ["#000000", "#e74c3c", "#3ec96a", DEFAULT_ANNOTATION_COLOR, "#ff68bd", "#f1d200"];

describe("EditorColorPicker", () => {
    it("renders one button per preset color", () => {
        renderWithProviders(<EditorColorPicker color="#abcdef" onChange={vi.fn()} />);

        for (const color of PRESET_COLORS) {
            expect(screen.getByRole("button", { name: color })).toBeInTheDocument();
        }
    });

    it.each(PRESET_COLORS)("calls onChange with %s when its preset is clicked", async (presetColor) => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<EditorColorPicker color="#abcdef" onChange={onChange} />);

        await user.click(screen.getByRole("button", { name: presetColor }));

        expect(onChange).toHaveBeenCalledWith(presetColor);
    });

    it("marks the active preset with aria-pressed=true and others with aria-pressed=false", () => {
        renderWithProviders(<EditorColorPicker color={DEFAULT_ANNOTATION_COLOR} onChange={vi.fn()} />);

        expect(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: "#000000" })).toHaveAttribute("aria-pressed", "false");
    });

    it("matches presets case-insensitively when computing aria-pressed", () => {
        renderWithProviders(<EditorColorPicker color={DEFAULT_ANNOTATION_COLOR.toUpperCase()} onChange={vi.fn()} />);

        expect(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR })).toHaveAttribute("aria-pressed", "true");
    });

    it("forwards a change from the native color input to onChange", () => {
        const onChange = vi.fn();
        const { container } = renderWithProviders(<EditorColorPicker color="#000000" onChange={onChange} />);

        const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
        expect(colorInput).not.toBeNull();

        fireEvent.change(colorInput, { target: { value: "#abcdef" } });

        expect(onChange).toHaveBeenCalledWith("#abcdef");
    });

    it("disables presets and the color input when disabled is true", () => {
        const onChange = vi.fn();
        const { container } = renderWithProviders(<EditorColorPicker color="#abcdef" onChange={onChange} disabled />);

        for (const presetColor of PRESET_COLORS) {
            expect(screen.getByRole("button", { name: presetColor })).toBeDisabled();
        }
        const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
        expect(colorInput).toBeDisabled();

        fireEvent.change(colorInput, { target: { value: "#abcdef" } });
        expect(onChange).not.toHaveBeenCalled();
    });

    it("renders every preset and forwards clicks in stacked layout mode", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<EditorColorPicker color="#abcdef" onChange={onChange} stacked />);

        for (const presetColor of PRESET_COLORS) {
            expect(screen.getByRole("button", { name: presetColor })).toBeInTheDocument();
        }

        const firstPreset = PRESET_COLORS[0]!;
        await user.click(screen.getByRole("button", { name: firstPreset }));
        expect(onChange).toHaveBeenCalledWith(firstPreset);
    });
});
