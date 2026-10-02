import { screen } from "@testing-library/react";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { MeasureThreatsTable } from "./measureThreatsTable.component";

const renderTable = (measureThreats?: []) =>
    renderWithProviders(
        <MeasureThreatsTable
            {...(measureThreats && { measureThreats })}
            sortBy="threatName"
            onChangeSortBy={vi.fn()}
            sortDirection="asc"
            userRole={undefined}
            onClickDeleteMeasureThreat={vi.fn()}
            onClickEditMeasureImpact={vi.fn()}
            onClickEditThreat={vi.fn()}
        />
    );

describe("MeasureThreatsTable — empty state", () => {
    it("shows the empty message inside a table cell spanning all columns", () => {
        renderTable([]);

        const cell = screen.getByRole("cell", { name: "Not applied to any threat" });
        expect(cell).toHaveAttribute("colspan", "5");
    });

    it("shows no empty message while threats are not loaded yet", () => {
        renderTable(undefined);

        expect(screen.queryByText("Not applied to any threat")).not.toBeInTheDocument();
    });
});
