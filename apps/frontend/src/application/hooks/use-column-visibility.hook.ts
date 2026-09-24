import type { GridColumnVisibilityModel } from "@mui/x-data-grid";
import { useCallback, useEffect, useState } from "react";
import { readTableViewSetting, writeTableViewSetting } from "#utils/table-view-storage.ts";

const isVisibilityModel = (value: unknown): value is GridColumnVisibilityModel =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === "boolean");

const readStoredVisibility = (storageKey: string, defaults: GridColumnVisibilityModel): GridColumnVisibilityModel => {
    const stored = readTableViewSetting(storageKey);
    return isVisibilityModel(stored) ? stored : defaults;
};

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
