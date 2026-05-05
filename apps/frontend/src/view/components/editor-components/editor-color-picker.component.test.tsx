import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorColorPicker } from "./editor-color-picker.component";
import { DEFAULT_ANNOTATION_COLOR } from "../../../application/hooks/use-annotation-drawing.hook";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";

const NON_DEFAULT_POA_COLORS = Object.values(POA_COLORS)
    .map((p) => p.normal)
    .filter((c) => c.toLowerCase() !== DEFAULT_ANNOTATION_COLOR.toLowerCase());

describe("EditorColorPicker", () => {
    it("renders the default-color preset and one button per non-default POA color", () => {
        renderWithProviders(<EditorColorPicker color="#000000" onChange={vi.fn()} />);

        expect(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR })).toBeInTheDocument();
        for (const color of NON_DEFAULT_POA_COLORS) {
            expect(screen.getByRole("button", { name: color })).toBeInTheDocument();
        }
    });

    it("calls onChange with the default color when the default preset is clicked", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(<EditorColorPicker color="#000000" onChange={onChange} />);

        await user.click(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR }));

        expect(onChange).toHaveBeenCalledWith(DEFAULT_ANNOTATION_COLOR);
    });

    it("calls onChange with the preset color when a POA preset is clicked", async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        const userBehaviorColor = POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal;
        renderWithProviders(<EditorColorPicker color="#000000" onChange={onChange} />);

        await user.click(screen.getByRole("button", { name: userBehaviorColor }));

        expect(onChange).toHaveBeenCalledWith(userBehaviorColor);
    });

    it("marks the active preset with aria-pressed=true and others with aria-pressed=false", () => {
        const userBehaviorColor = POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal;
        renderWithProviders(<EditorColorPicker color={userBehaviorColor} onChange={vi.fn()} />);

        expect(screen.getByRole("button", { name: userBehaviorColor })).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR })).toHaveAttribute("aria-pressed", "false");
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
        expect(colorInput.value).toBe("#000000");

        fireEvent.change(colorInput, { target: { value: "#abcdef" } });

        expect(onChange).toHaveBeenCalledWith("#abcdef");
    });

    it("disables presets and the color input when disabled is true", () => {
        const onChange = vi.fn();
        const { container } = renderWithProviders(<EditorColorPicker color="#000000" onChange={onChange} disabled />);

        expect(screen.getByRole("button", { name: DEFAULT_ANNOTATION_COLOR })).toBeDisabled();
        for (const color of NON_DEFAULT_POA_COLORS) {
            expect(screen.getByRole("button", { name: color })).toBeDisabled();
        }
        const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
        expect(colorInput).toBeDisabled();

        fireEvent.change(colorInput, { target: { value: "#abcdef" } });
        expect(onChange).not.toHaveBeenCalled();
    });
});
