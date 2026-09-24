import type { GridColDef, GridColumnVisibilityModel, GridValidRowModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";
import { readTableViewSetting, writeTableViewSetting } from "#utils/table-view-storage.ts";

const isVisibilityModel = (value: unknown): value is GridColumnVisibilityModel =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "boolean");

const readStoredVisibility = (storageKey: string, defaults: GridColumnVisibilityModel): GridColumnVisibilityModel => {
    const stored = readTableViewSetting(storageKey);
    // Defaults first: a model stored before a column existed must not show that column by accident.
    return isVisibilityModel(stored) ? { ...defaults, ...stored } : defaults;
};

/**
 * The [field, label] entries for a table's customize-view menu, in label order, limited to
 * the columns the table actually renders: the column factories drop role-restricted columns
 * (e.g. actions for viewers), and the menu must not offer to toggle a column that isn't there.
 */
export const getToggleableColumns = <Row extends GridValidRowModel>(
    columnLabels: Record<string, string>,
    columns: readonly GridColDef<Row>[]
): [field: string, label: string][] =>
    Object.entries(columnLabels).filter(([field]) => columns.some((column) => column.field === field));

/**
 * Column-visibility model for a table, persisted per storage key in
 * sessionStorage (cleared on logout). The model reloads when the key changes:
 * the page can stay mounted while the route entity changes (e.g. navigating
 * between two projects' pages via browser history), and must not carry one
 * entity's settings over to the other. Pass module-constant defaults.
 */
export const useColumnVisibility = (storageKey: string, defaults: GridColumnVisibilityModel) => {
    const [columnVisibility, setColumnVisibility] = useState(() => readStoredVisibility(storageKey, defaults));

    useEffect(() => {
        setColumnVisibility(readStoredVisibility(storageKey, defaults));
    }, [storageKey, defaults]);

    const toggleColumnVisibility = useCallback(
        (field: string) => {
            setColumnVisibility((prev) => {
                const newVisibility = { ...prev, [field]: !prev[field] };
                writeTableViewSetting(storageKey, newVisibility);
                return newVisibility;
            });
        },
        [storageKey]
    );

    return { columnVisibility, toggleColumnVisibility };
};
