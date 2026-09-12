import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { PageSettingsColumn, type PageToggle } from "./page-settings-column.component";

const createToggle = (overrides: Partial<PageToggle> = {}): PageToggle => ({
    id: "coverPage",
    checked: false,
    onChange: vi.fn(),
    ...overrides,
});

describe("PageSettingsColumn", () => {
    it("renders the page-settings heading", () => {
        renderWithProviders(<PageSettingsColumn toggles={[]} />);
        expect(screen.getByText("Page Settings")).toBeInTheDocument();
    });

    it("renders one switch per toggle, labelled by its id", () => {
        const toggles = [
            createToggle({ id: "coverPage" }),
            createToggle({ id: "matrixPage" }),
            createToggle({ id: "threatsPage" }),
        ];
        renderWithProviders(<PageSettingsColumn toggles={toggles} />);

        expect(screen.getAllByRole("switch")).toHaveLength(3);
        expect(screen.getByLabelText("Show Cover Page")).toBeInTheDocument();
        expect(screen.getByLabelText("Show Matrix Page")).toBeInTheDocument();
        expect(screen.getByLabelText("Show Threats Page")).toBeInTheDocument();
    });

    it("reflects each toggle's checked state", () => {
        renderWithProviders(
            <PageSettingsColumn
                toggles={[
                    createToggle({ id: "coverPage", checked: true }),
                    createToggle({ id: "matrixPage", checked: false }),
                ]}
            />
        );

        expect(screen.getByLabelText("Show Cover Page")).toBeChecked();
        expect(screen.getByLabelText("Show Matrix Page")).not.toBeChecked();
    });

    it("calls the toggle's onChange with true when an unchecked switch is clicked", async () => {
        const onChange = vi.fn();
        renderWithProviders(
            <PageSettingsColumn toggles={[createToggle({ id: "coverPage", checked: false, onChange })]} />
        );

        await userEvent.click(screen.getByLabelText("Show Cover Page"));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(expect.anything(), true);
    });

    it("calls the toggle's onChange with false when a checked switch is clicked", async () => {
        const onChange = vi.fn();
        renderWithProviders(
            <PageSettingsColumn toggles={[createToggle({ id: "coverPage", checked: true, onChange })]} />
        );

        await userEvent.click(screen.getByLabelText("Show Cover Page"));

        expect(onChange).toHaveBeenCalledWith(expect.anything(), false);
    });

    it("only toggles the clicked switch, leaving the others untouched", async () => {
        const onChangeCover = vi.fn();
        const onChangeMatrix = vi.fn();
        renderWithProviders(
            <PageSettingsColumn
                toggles={[
                    createToggle({ id: "coverPage", onChange: onChangeCover }),
                    createToggle({ id: "matrixPage", onChange: onChangeMatrix }),
                ]}
            />
        );

        await userEvent.click(screen.getByLabelText("Show Matrix Page"));

        expect(onChangeMatrix).toHaveBeenCalledTimes(1);
        expect(onChangeCover).not.toHaveBeenCalled();
    });

    it("renders no switches when the toggles list is empty", () => {
        renderWithProviders(<PageSettingsColumn toggles={[]} />);
        expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    });
});
