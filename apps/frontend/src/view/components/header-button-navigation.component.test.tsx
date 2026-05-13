import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ButtonNavigation } from "./header-button-navigation.component";
import type { ToggleButtonConfig } from "./toggle-buttons.component";

const buttons: ToggleButtonConfig[] = [
    { value: "/projects", text: "Projects" },
    { value: "/catalogs", text: "Catalogs" },
];

describe("ButtonNavigation", () => {
    it("should render one button per config entry", () => {
        render(<ButtonNavigation buttons={buttons} />);
        expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("should render the text label for each button", () => {
        render(<ButtonNavigation buttons={buttons} />);
        expect(screen.getByText("Projects")).toBeInTheDocument();
        expect(screen.getByText("Catalogs")).toBeInTheDocument();
    });

    it("should mark the button matching the value prop as selected", () => {
        render(<ButtonNavigation buttons={buttons} value="/projects" />);
        const projectsBtn = screen.getByText("Projects").closest("button");
        expect(projectsBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("should not mark any button as selected when value does not match", () => {
        render(<ButtonNavigation buttons={buttons} value="/other" />);
        const allButtons = screen.getAllByRole("button");
        allButtons.forEach((btn) => {
            expect(btn).toHaveAttribute("aria-pressed", "false");
        });
    });

    it("should call onChange with the selected value when a button is clicked", async () => {
        const handleChange = vi.fn();
        render(<ButtonNavigation buttons={buttons} onChange={handleChange} />);

        await userEvent.click(screen.getByText("Catalogs"));

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(expect.anything(), "/catalogs");
    });

    it("should render nothing when the buttons array is empty", () => {
        render(<ButtonNavigation buttons={[]} />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
});
