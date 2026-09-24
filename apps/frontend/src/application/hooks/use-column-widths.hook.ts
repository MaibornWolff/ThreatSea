import type { GridColDef, GridColumnResizeParams, GridValidRowModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";
import { tableViewStorageKey } from "#utils/table-view-storage.ts";

type ColumnWidths = Record<string, number>;

const isColumnWidths = (value: unknown): value is ColumnWidths =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "number" && Number.isFinite(entry) && entry > 0);

const readStoredWidths = (storageKey: string): ColumnWidths => {
    const stored = sessionStorage.getItem(tableViewStorageKey(storageKey));
    if (stored) {
        try {
            const parsed: unknown = JSON.parse(stored);
            if (isColumnWidths(parsed)) {
                return parsed;
            }
        } catch {
            // Fall through to no stored widths on malformed entries.
        }
    }
    return {};
};

/**
 * Overrides the width of every column the user has resized. `flex: 0` is
 * required: a flex column ignores its width.
 */
export const applyColumnWidths = <Row extends GridValidRowModel>(
    columns: GridColDef<Row>[],
    columnWidths: ColumnWidths
): GridColDef<Row>[] =>
    columns.map((column) => {
        const storedWidth = columnWidths[column.field];
        return storedWidth === undefined ? column : { ...column, width: storedWidth, flex: 0 };
    });

/**
 * User-resized column widths for a table, persisted per storage key in
 * sessionStorage (cleared on logout). The pages rebuild their column
 * definitions whenever filter state changes, and DataGrid resets a column to
 * its definition's width on every rebuild — so resized widths must be part of
 * the definitions (via applyColumnWidths), not only DataGrid's internal state.
 * Reloads when the key changes, like useColumnVisibility.
 */
export const useColumnWidths = (storageKey: string) => {
    const [columnWidths, setColumnWidths] = useState(() => readStoredWidths(storageKey));

    useEffect(() => {
        setColumnWidths(readStoredWidths(storageKey));
    }, [storageKey]);

    const handleColumnWidthChange = useCallback(
        ({ colDef, width }: GridColumnResizeParams) => {
            setColumnWidths((previous) => {
                const newWidths = { ...previous, [colDef.field]: width };
                sessionStorage.setItem(tableViewStorageKey(storageKey), JSON.stringify(newWidths));
                return newWidths;
            });
        },
        [storageKey]
    );

    return { columnWidths, handleColumnWidthChange };
};
