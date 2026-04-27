import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PointOfAttackSwitch, type PointOfAttackSwitchProps } from "./point-of-attack-switch.component";

const setup = (propsOverride: Partial<PointOfAttackSwitchProps> = {}) => {
    const props = {
        color: "#ff0000",
        label: "Test Label",
        onLabelClick: vi.fn(),
        checked: false,
        onChange: vi.fn(),
        ...propsOverride,
    };
    const user = userEvent.setup();
    render(<PointOfAttackSwitch {...props} />);
    return { props, user };
};

describe("PointOfAttackSwitch", () => {
    it("renders the label text", () => {
        setup();

        expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("renders a switch", () => {
        setup();

        expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("switch is unchecked by default", () => {
        setup({ checked: false });

        expect(screen.getByRole("switch")).not.toBeChecked();
    });

    it("switch reflects checked state", () => {
        setup({ checked: true });

        expect(screen.getByRole("switch")).toBeChecked();
    });

    it("toggling the switch calls onChange", async () => {
        const { props, user } = setup();

        expect(props.onChange).not.toHaveBeenCalled();

        await user.click(screen.getByRole("switch"));

        expect(props.onChange).toHaveBeenCalledOnce();
    });

    it("clicking the label calls onLabelClick", async () => {
        const { props, user } = setup();

        expect(props.onLabelClick).not.toHaveBeenCalled();

        await user.click(screen.getByText("Test Label"));

        expect(props.onLabelClick).toHaveBeenCalledOnce();
    });

    it("clicking the label does not toggle the switch", async () => {
        const { props, user } = setup();

        await user.click(screen.getByText("Test Label"));

        expect(props.onChange).not.toHaveBeenCalled();
    });
});
