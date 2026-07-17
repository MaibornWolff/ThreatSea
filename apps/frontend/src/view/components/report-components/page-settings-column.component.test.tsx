import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// t returns the key so we can assert on the untranslated ids/labels directly.
vi.mock("react-i18next", () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

import { PageSettingsColumn, type PageToggle } from "./page-settings-column.component";

const createToggle = (overrides: Partial<PageToggle> = {}): PageToggle => ({
    id: "coverPage",
    checked: false,
    onChange: vi.fn(),
    ...overrides,
});

describe("PageSettingsColumn", () => {
    it("renders the page-settings heading", () => {
        render(<PageSettingsColumn toggles={[]} />);
        expect(screen.getByText("pageSettings")).toBeInTheDocument();
    });

    it("renders one switch per toggle, labelled by its id", () => {
        const toggles = [
            createToggle({ id: "coverPage" }),
            createToggle({ id: "matrixPage" }),
            createToggle({ id: "threatsPage" }),
        ];
        render(<PageSettingsColumn toggles={toggles} />);

        expect(screen.getAllByRole("switch")).toHaveLength(3);
        expect(screen.getByLabelText("coverPage")).toBeInTheDocument();
        expect(screen.getByLabelText("matrixPage")).toBeInTheDocument();
        expect(screen.getByLabelText("threatsPage")).toBeInTheDocument();
    });

    it("reflects each toggle's checked state", () => {
        render(
            <PageSettingsColumn
                toggles={[
                    createToggle({ id: "coverPage", checked: true }),
                    createToggle({ id: "matrixPage", checked: false }),
                ]}
            />
        );

        expect(screen.getByLabelText("coverPage")).toBeChecked();
        expect(screen.getByLabelText("matrixPage")).not.toBeChecked();
    });

    it("calls the toggle's onChange with true when an unchecked switch is clicked", async () => {
        const onChange = vi.fn();
        render(<PageSettingsColumn toggles={[createToggle({ id: "coverPage", checked: false, onChange })]} />);

        await userEvent.click(screen.getByLabelText("coverPage"));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.anything(), true);
    });

    it("calls the toggle's onChange with false when a checked switch is clicked", async () => {
        const onChange = vi.fn();
        render(<PageSettingsColumn toggles={[createToggle({ id: "coverPage", checked: true, onChange })]} />);

        await userEvent.click(screen.getByLabelText("coverPage"));

        expect(onChange).toHaveBeenCalledWith(expect.anything(), false);
    });

    it("only toggles the clicked switch, leaving the others untouched", async () => {
        const onChangeCover = vi.fn();
        const onChangeMatrix = vi.fn();
        render(
            <PageSettingsColumn
                toggles={[
                    createToggle({ id: "coverPage", onChange: onChangeCover }),
                    createToggle({ id: "matrixPage", onChange: onChangeMatrix }),
                ]}
            />
        );

        await userEvent.click(screen.getByLabelText("matrixPage"));

        expect(onChangeMatrix).toHaveBeenCalledTimes(1);
        expect(onChangeCover).not.toHaveBeenCalled();
    });

    it("renders no switches when the toggles list is empty", () => {
        render(<PageSettingsColumn toggles={[]} />);
        expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    });
});
