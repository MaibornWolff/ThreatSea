import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { createAsset } from "#test-utils/builders.ts";
import { AddThreatAssetsTab } from "./add-threat-assets-tab.component";

describe("AddThreatAssetsTab", () => {
    it("renders a row for each asset with its id, name and C/I/A ratings", () => {
        const assets = [
            createAsset({ id: 11, name: "Customer Database", confidentiality: 4, integrity: 3, availability: 2 }),
            createAsset({ id: 22, name: "Billing Service", confidentiality: 1, integrity: 5, availability: 0 }),
        ];

        renderWithProviders(<AddThreatAssetsTab active={true} assets={assets} />);

        const firstRow = screen.getByText("Customer Database").closest("tr")!;
        expect(within(firstRow).getByText("11")).toBeInTheDocument();
        expect(within(firstRow).getByText("4")).toBeInTheDocument();
        expect(within(firstRow).getByText("3")).toBeInTheDocument();
        expect(within(firstRow).getByText("2")).toBeInTheDocument();

        const secondRow = screen.getByText("Billing Service").closest("tr")!;
        expect(within(secondRow).getByText("22")).toBeInTheDocument();
        expect(within(secondRow).getByText("5")).toBeInTheDocument();
        expect(within(secondRow).getByText("0")).toBeInTheDocument();
    });

    it("renders the ID, Name and C/I/A column headers", () => {
        renderWithProviders(<AddThreatAssetsTab active={true} assets={[]} />);

        expect(screen.getByRole("columnheader", { name: "ID" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "C" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "I" })).toBeInTheDocument();
        expect(screen.getByRole("columnheader", { name: "A" })).toBeInTheDocument();
    });

    it("renders only the header row when there are no assets", () => {
        renderWithProviders(<AddThreatAssetsTab active={true} assets={[]} />);

        // No data rows are rendered, so only the single header row remains.
        expect(screen.getAllByRole("row")).toHaveLength(1);
    });

    it("keeps its assets mounted when inactive so switching tabs does not remount the table", () => {
        const assets = [createAsset({ id: 11, name: "Customer Database" })];

        renderWithProviders(<AddThreatAssetsTab active={false} assets={assets} />);

        // The tab hides via CSS display rather than unmounting, so the row stays queryable.
        expect(screen.getByText("Customer Database")).toBeInTheDocument();
    });
});
