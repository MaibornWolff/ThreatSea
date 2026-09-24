import { act, renderHook } from "@testing-library/react";
import { tableViewStorageKey } from "#utils/table-view-storage.ts";
import { getToggleableColumns, useColumnVisibility } from "./use-column-visibility.hook";

const DEFAULTS = { name: true, actions: true };

describe("useColumnVisibility", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("falls back to the defaults when nothing is stored", () => {
        const { result } = renderHook(() => useColumnVisibility("table-1", DEFAULTS));
        expect(result.current.columnVisibility).toEqual(DEFAULTS);
    });

    it("restores a stored model and persists toggles under the key", () => {
        sessionStorage.setItem(tableViewStorageKey("table-1"), JSON.stringify({ name: false, actions: true }));
        const { result } = renderHook(() => useColumnVisibility("table-1", DEFAULTS));
        expect(result.current.columnVisibility).toEqual({ name: false, actions: true });

        act(() => result.current.toggleColumnVisibility("name"));
        expect(result.current.columnVisibility).toEqual({ name: true, actions: true });
        expect(JSON.parse(sessionStorage.getItem(tableViewStorageKey("table-1"))!)).toEqual({
            name: true,
            actions: true,
        });
    });

    it.each(["not-json{", "null", "[]", '"columns"', '{"name":"false"}'])(
        "ignores invalid stored value %s",
        (stored) => {
            sessionStorage.setItem(tableViewStorageKey("table-1"), stored);
            const { result } = renderHook(() => useColumnVisibility("table-1", DEFAULTS));
            expect(result.current.columnVisibility).toEqual(DEFAULTS);
        }
    );

    it("falls back to the defaults and still toggles in memory when sessionStorage is unavailable", () => {
        vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
            throw new DOMException("The operation is insecure.", "SecurityError");
        });
        const { result } = renderHook(() => useColumnVisibility("table-1", DEFAULTS));
        expect(result.current.columnVisibility).toEqual(DEFAULTS);

        act(() => result.current.toggleColumnVisibility("name"));
        expect(result.current.columnVisibility).toEqual({ name: false, actions: true });
    });

    it("reloads the model when the storage key changes without a remount", () => {
        sessionStorage.setItem(tableViewStorageKey("project-1"), JSON.stringify({ name: false, actions: true }));
        const { result, rerender } = renderHook(({ key }) => useColumnVisibility(key, DEFAULTS), {
            initialProps: { key: "project-1" },
        });
        expect(result.current.columnVisibility).toEqual({ name: false, actions: true });

        rerender({ key: "project-2" });
        expect(result.current.columnVisibility).toEqual(DEFAULTS);

        act(() => result.current.toggleColumnVisibility("actions"));
        expect(JSON.parse(sessionStorage.getItem(tableViewStorageKey("project-2"))!)).toEqual({
            name: true,
            actions: false,
        });
        expect(JSON.parse(sessionStorage.getItem(tableViewStorageKey("project-1"))!)).toEqual({
            name: false,
            actions: true,
        });
    });
});

describe("getToggleableColumns", () => {
    const columnLabels = { name: "Name", createdAt: "Created", actions: "Actions" };

    it("offers every labelled column the table renders, in label order", () => {
        const columns = [{ field: "actions" }, { field: "createdAt" }, { field: "name" }];

        expect(getToggleableColumns(columnLabels, columns)).toEqual([
            ["name", "Name"],
            ["createdAt", "Created"],
            ["actions", "Actions"],
        ]);
    });

    it("leaves out labelled columns the table does not render, such as actions for viewers", () => {
        const columns = [{ field: "name" }, { field: "createdAt" }];

        expect(getToggleableColumns(columnLabels, columns)).toEqual([
            ["name", "Name"],
            ["createdAt", "Created"],
        ]);
    });

    it("offers nothing for rendered columns without a label or for a table without columns", () => {
        expect(getToggleableColumns(columnLabels, [{ field: "unlabelled" }])).toEqual([]);
        expect(getToggleableColumns(columnLabels, [])).toEqual([]);
    });
});

// Module-constant, as the hook requires: a new defaults object per render would reload on every render.
const DEFAULTS_WITH_NEW_COLUMN = { name: true, description: false, actions: true };

describe("useColumnVisibility with a model stored before a column existed", () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it("applies the new column's default instead of showing it", () => {
        sessionStorage.setItem(tableViewStorageKey("table-1"), JSON.stringify({ name: false, actions: true }));

        const { result } = renderHook(() => useColumnVisibility("table-1", DEFAULTS_WITH_NEW_COLUMN));

        expect(result.current.columnVisibility).toEqual({ name: false, description: false, actions: true });
    });
});
