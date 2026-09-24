import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { useColumnFilters } from "#application/hooks/use-column-filters.hook.ts";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ColumnFilterHeader } from "./column-filter-header.component.tsx";

const renderHeader = (props: Partial<ComponentProps<typeof ColumnFilterHeader>> = {}) => {
    const onFilterChange = vi.fn();
    const onToggleExpanded = vi.fn();
    renderWithProviders(
        <ColumnFilterHeader
            field="name"
            label="Name"
            columnFilters={{}}
            onFilterChange={onFilterChange}
            expandedFilters={{}}
            onToggleExpanded={onToggleExpanded}
            {...props}
        />
    );
    return { onFilterChange, onToggleExpanded };
};

const getFilterToggle = () => screen.getByRole("button", { name: "Toggle Name filter" });

describe("ColumnFilterHeader", () => {
    it("shows the label, a toggle and an empty filter input, expanded by default", () => {
        renderHeader();

        expect(screen.getByText("Name")).toBeVisible();
        expect(getFilterToggle()).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByPlaceholderText("Filter...")).toBeVisible();
        expect(screen.getByPlaceholderText("Filter...")).toHaveValue("");
    });

    it("shows the current filter value of its own column", () => {
        renderHeader({ columnFilters: { name: "server", email: "admin" } });

        expect(screen.getByPlaceholderText("Filter...")).toHaveValue("server");
    });

    it("hides the filter when its column is explicitly collapsed", () => {
        renderHeader({ expandedFilters: { name: false } });

        expect(getFilterToggle()).toHaveAttribute("aria-expanded", "false");
        expect(screen.getByPlaceholderText("Filter...")).not.toBeVisible();
    });

    it("ignores the expansion state of other columns", () => {
        renderHeader({ expandedFilters: { email: false } });

        expect(getFilterToggle()).toHaveAttribute("aria-expanded", "true");
        expect(screen.getByPlaceholderText("Filter...")).toBeVisible();
    });

    it("reports its column when the toggle is clicked", async () => {
        const { onToggleExpanded, onFilterChange } = renderHeader();

        await userEvent.click(getFilterToggle());

        expect(onToggleExpanded).toHaveBeenCalledExactlyOnceWith("name");
        expect(onFilterChange).not.toHaveBeenCalled();
    });

    it("reports its column and the new value on every keystroke", async () => {
        const { onFilterChange } = renderHeader();

        await userEvent.type(screen.getByPlaceholderText("Filter..."), "ab");

        expect(onFilterChange).toHaveBeenNthCalledWith(1, "name", "a");
        expect(onFilterChange).toHaveBeenNthCalledWith(2, "name", "b");
    });

    it("renders a custom filter in place of the text input", () => {
        renderHeader({
            children: (
                <select aria-label="Status filter">
                    <option>All</option>
                </select>
            ),
        });

        expect(screen.getByRole("combobox", { name: "Status filter" })).toBeVisible();
        expect(screen.queryByPlaceholderText("Filter...")).not.toBeInTheDocument();
    });

    it("collapses a custom filter like the text input", () => {
        renderHeader({
            expandedFilters: { name: false },
            children: (
                <select aria-label="Status filter">
                    <option>All</option>
                </select>
            ),
        });

        expect(screen.getByLabelText("Status filter")).not.toBeVisible();
    });
});

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
    it("clicking the filter toggle collapses the filter without sorting the column", async () => {
        renderWithProviders(<FilterableGrid />);

        await userEvent.click(getFilterToggle());

        expect(getFilterToggle()).toHaveAttribute("aria-expanded", "false");
        expect(getNameColumnHeader()).not.toHaveAttribute("aria-sort", "ascending");
    });

    it("clicking into the filter input does not sort the column", async () => {
        renderWithProviders(<FilterableGrid />);

        await userEvent.click(screen.getByPlaceholderText("Filter..."));

        expect(getNameColumnHeader()).not.toHaveAttribute("aria-sort", "ascending");
    });

    it("clicking the column label still sorts the column", async () => {
        renderWithProviders(<FilterableGrid />);

        await userEvent.click(screen.getByText("Name"));

        expect(getNameColumnHeader()).toHaveAttribute("aria-sort", "ascending");
    });

    it("pressing Enter on the filter toggle collapses the filter without sorting the column", async () => {
        renderWithProviders(<FilterableGrid />);
        const toggle = getFilterToggle();

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
        expect(getFilterToggle()).toHaveAttribute("aria-expanded", "true");
    });

    it("keeps keyboard focus on the column header rather than the filter toggle, and Tab reaches the filter input", async () => {
        renderWithProviders(<FilterableGrid />);

        act(() => getNameColumnHeader().focus());
        expect(getNameColumnHeader()).toHaveFocus();
        await userEvent.tab();

        expect(screen.getByPlaceholderText("Filter...")).toHaveFocus();
    });
});
