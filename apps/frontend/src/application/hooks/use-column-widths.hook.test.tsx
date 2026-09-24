import { DataGrid, useGridApiRef, type GridApi, type GridColDef, type GridColumnResizeParams } from "@mui/x-data-grid";
import { act, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RefObject } from "react";
import { renderWithProviders } from "#test-utils/render-with-providers.tsx";
import { ColumnFilterHeader } from "#view/components/column-filter-header.component.tsx";
import { useColumnFilters } from "./use-column-filters.hook";
import { applyColumnWidths, useColumnWidths } from "./use-column-widths.hook";

const resizeTo = (field: string, width: number) => ({ colDef: { field }, width }) as GridColumnResizeParams;

describe("useColumnWidths", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("starts without widths when nothing is stored", () => {
        const { result } = renderHook(() => useColumnWidths("table-1"));
        expect(result.current.columnWidths).toEqual({});
    });

    it("restores stored widths and persists resizes under the key", () => {
        sessionStorage.setItem("table-1", JSON.stringify({ name: 320 }));
        const { result } = renderHook(() => useColumnWidths("table-1"));
        expect(result.current.columnWidths).toEqual({ name: 320 });

        act(() => result.current.handleColumnWidthChange(resizeTo("createdAt", 150)));
        expect(result.current.columnWidths).toEqual({ name: 320, createdAt: 150 });
        expect(JSON.parse(sessionStorage.getItem("table-1")!)).toEqual({ name: 320, createdAt: 150 });
    });

    it("keeps only the latest width when a column is resized again", () => {
        const { result } = renderHook(() => useColumnWidths("table-1"));

        act(() => result.current.handleColumnWidthChange(resizeTo("name", 300)));
        act(() => result.current.handleColumnWidthChange(resizeTo("name", 250)));

        expect(result.current.columnWidths).toEqual({ name: 250 });
    });

    it.each(["not-json{", "null", "[]", '"widths"', '{"name":"300"}', '{"name":0}', '{"name":-5}'])(
        "ignores invalid stored value %s",
        (stored) => {
            sessionStorage.setItem("table-1", stored);
            const { result } = renderHook(() => useColumnWidths("table-1"));
            expect(result.current.columnWidths).toEqual({});
        }
    );

    it("reloads the widths when the storage key changes without a remount", () => {
        sessionStorage.setItem("project-1", JSON.stringify({ name: 320 }));
        const { result, rerender } = renderHook(({ key }) => useColumnWidths(key), {
            initialProps: { key: "project-1" },
        });
        expect(result.current.columnWidths).toEqual({ name: 320 });

        rerender({ key: "project-2" });
        expect(result.current.columnWidths).toEqual({});

        act(() => result.current.handleColumnWidthChange(resizeTo("name", 200)));
        expect(JSON.parse(sessionStorage.getItem("project-2")!)).toEqual({ name: 200 });
        expect(JSON.parse(sessionStorage.getItem("project-1")!)).toEqual({ name: 320 });
    });
});

describe("applyColumnWidths", () => {
    const columns: GridColDef[] = [
        { field: "name", flex: 1, minWidth: 200 },
        { field: "createdAt", flex: 1, minWidth: 180 },
        { field: "actions", width: 80 },
    ];

    it("returns the columns unchanged when nothing was resized", () => {
        expect(applyColumnWidths(columns, {})).toEqual(columns);
    });

    it("gives resized columns their width and stops them flexing, leaving the others as defined", () => {
        expect(applyColumnWidths(columns, { name: 320, actions: 120 })).toEqual([
            { field: "name", flex: 0, minWidth: 200, width: 320 },
            { field: "createdAt", flex: 1, minWidth: 180 },
            { field: "actions", width: 120, flex: 0 },
        ]);
    });

    it("ignores stored widths for columns the table no longer has", () => {
        expect(applyColumnWidths(columns, { removedColumn: 300 })).toEqual(columns);
    });
});

describe("useColumnWidths with a DataGrid whose columns are rebuilt on filtering", () => {
    let gridApi: RefObject<GridApi | null>;

    const ResizableFilterableGrid = () => {
        const apiRef = useGridApiRef();
        gridApi = apiRef;
        const { columnFilters, expandedFilters, handleFilterChange, toggleFilterExpanded } = useColumnFilters();
        const { columnWidths, handleColumnWidthChange } = useColumnWidths("table-1");
        // Rebuilt on every render, like the pages' filter-dependent column definitions.
        const columns = applyColumnWidths(
            [
                {
                    field: "name",
                    flex: 1,
                    minWidth: 100,
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
                { field: "createdAt", flex: 1, minWidth: 100 },
            ],
            columnWidths
        );

        return (
            <DataGrid
                apiRef={apiRef}
                rows={[{ id: 1, name: "Alpha", createdAt: "2026-09-24" }]}
                columns={columns}
                onColumnWidthChange={handleColumnWidthChange}
                disableColumnMenu
            />
        );
    };

    beforeEach(() => {
        sessionStorage.clear();
    });

    it("keeps a resized width when typing in a filter rebuilds the columns", async () => {
        renderWithProviders(<ResizableFilterableGrid />);

        act(() => gridApi.current!.setColumnWidth("name", 320));
        await userEvent.type(screen.getByPlaceholderText("Filter..."), "Al");

        expect(gridApi.current!.getColumn("name").computedWidth).toBe(320);
    });

    it("restores a resized width when the table is mounted again in the same session", () => {
        const { unmount } = renderWithProviders(<ResizableFilterableGrid />);
        act(() => gridApi.current!.setColumnWidth("name", 320));
        unmount();

        renderWithProviders(<ResizableFilterableGrid />);

        expect(gridApi.current!.getColumn("name").computedWidth).toBe(320);
    });
});
