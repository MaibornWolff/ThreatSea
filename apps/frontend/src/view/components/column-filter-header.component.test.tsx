import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useColumnFilters } from "#application/hooks/use-column-filters.hook.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ColumnFilterHeader } from "./column-filter-header.component.tsx";

const FilterableGrid = () => {
    const { columnFilters, expandedFilters, handleFilterChange, toggleFilterExpanded } = useColumnFilters();
    const columns: GridColDef[] = [
        {
            field: "name",
            headerName: "Name",
            renderHeader: () => (
                <ColumnFilterHeader
                    field="name"
                    label="Name"
                    columnFilters={columnFilters}
                    onFilterChange={handleFilterChange}
                    expandedFilters={expandedFilters}
                    onToggleExpanded={toggleFilterExpanded}
                />
            ),
        },
    ];

    return (
        <DataGrid
            rows={[
                { id: 1, name: "Alpha" },
                { id: 2, name: "Beta" },
            ]}
            columns={columns}
            disableColumnMenu
        />
    );
};

const getNameColumnHeader = () => screen.getByRole("columnheader");

describe("ColumnFilterHeader inside a sortable DataGrid column", () => {
    it("pressing Enter on the filter toggle collapses the filter without sorting the column", async () => {
        renderWithProviders(<FilterableGrid />);
        const toggle = screen.getByRole("button", { name: "Toggle Name filter" });

        toggle.focus();
        await userEvent.keyboard("{Enter}");

        expect(toggle).toHaveAttribute("aria-expanded", "false");
        expect(getNameColumnHeader()).not.toHaveAttribute("aria-sort", "ascending");
    });

    it("pressing Enter in the filter input keeps the typed value without sorting the column", async () => {
        renderWithProviders(<FilterableGrid />);
        const filterInput = screen.getByPlaceholderText("Filter...");

        await userEvent.type(filterInput, "Al{Enter}");

        expect(filterInput).toHaveValue("Al");
        expect(getNameColumnHeader()).not.toHaveAttribute("aria-sort", "ascending");
    });

    it("pressing Enter on the focused column header still sorts it and leaves the filter open", async () => {
        renderWithProviders(<FilterableGrid />);

        getNameColumnHeader().focus();
        await userEvent.keyboard("{Enter}");

        expect(getNameColumnHeader()).toHaveAttribute("aria-sort", "ascending");
        expect(screen.getByRole("button", { name: "Toggle Name filter" })).toHaveAttribute("aria-expanded", "true");
    });

    it("keeps keyboard focus on the column header rather than the filter toggle, and Tab reaches the filter input", async () => {
        renderWithProviders(<FilterableGrid />);

        act(() => getNameColumnHeader().focus());
        expect(getNameColumnHeader()).toHaveFocus();
        await userEvent.tab();

        expect(screen.getByPlaceholderText("Filter...")).toHaveFocus();
    });
});
