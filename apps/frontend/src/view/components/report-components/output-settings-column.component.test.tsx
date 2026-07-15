import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";

// Keep the real module (renderWithProviders needs I18nextProvider) but force t to
// return the key so we can assert on the untranslated headings directly.
vi.mock("react-i18next", async (importOriginal) => ({
    ...(await importOriginal<typeof import("react-i18next")>()),
    useTranslation: () => ({ t: (key: string) => key }),
}));

import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { OutputSettingsColumn } from "./output-settings-column.component";

type OutputSettingsColumnProps = ComponentProps<typeof OutputSettingsColumn>;

const defaultProps: OutputSettingsColumnProps = {
    reportLanguage: "en",
    onChangeLanguage: vi.fn(),
    sortBy: "netRisk",
    onChangeSortBy: vi.fn(),
    sortDirection: "desc",
    onChangeSortDirection: vi.fn(),
    onExport: vi.fn(),
};

const renderColumn = (props: Partial<OutputSettingsColumnProps> = {}) =>
    renderWithProviders(<OutputSettingsColumn {...defaultProps} {...props} />);

describe("OutputSettingsColumn", () => {
    it("renders the language, sort and export headings", () => {
        renderColumn();
        expect(screen.getByText("language")).toBeInTheDocument();
        expect(screen.getByText("sortThreats")).toBeInTheDocument();
        expect(screen.getByText("export")).toBeInTheDocument();
    });

    it("calls onChangeLanguage with the picked language", async () => {
        const onChangeLanguage = vi.fn();
        renderColumn({ reportLanguage: "en", onChangeLanguage });

        await userEvent.click(screen.getByRole("button", { name: "DE" }));

        expect(onChangeLanguage).toHaveBeenCalledWith(expect.anything(), "de");
    });

    it("calls onChangeSortBy with the picked sort field", async () => {
        const onChangeSortBy = vi.fn();
        renderColumn({ sortBy: "netRisk", onChangeSortBy });

        await userEvent.click(screen.getByRole("button", { name: "risk_gross" }));

        expect(onChangeSortBy).toHaveBeenCalledWith(expect.anything(), "risk");
    });

    it("calls onChangeSortDirection with the picked direction", async () => {
        const onChangeSortDirection = vi.fn();
        renderColumn({ sortDirection: "desc", onChangeSortDirection });

        await userEvent.click(screen.getByTestId("ArrowUpwardIcon"));

        expect(onChangeSortDirection).toHaveBeenCalledWith(expect.anything(), "asc");
    });

    it("calls onExport when the export button is clicked", async () => {
        const onExport = vi.fn();
        renderColumn({ onExport });

        await userEvent.click(screen.getByTestId("FileDownloadIcon"));

        expect(onExport).toHaveBeenCalledTimes(1);
    });
});
