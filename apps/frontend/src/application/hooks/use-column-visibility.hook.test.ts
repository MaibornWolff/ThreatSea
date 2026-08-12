import { act, renderHook } from "@testing-library/react";
import { useColumnVisibility } from "./use-column-visibility.hook";

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
        sessionStorage.setItem("table-1", JSON.stringify({ name: false, actions: true }));
        const { result } = renderHook(() => useColumnVisibility("table-1", DEFAULTS));
        expect(result.current.columnVisibility).toEqual({ name: false, actions: true });

        act(() => result.current.toggleColumnVisibility("name"));
        expect(result.current.columnVisibility).toEqual({ name: true, actions: true });
        expect(JSON.parse(sessionStorage.getItem("table-1")!)).toEqual({ name: true, actions: true });
    });

    it.each(["not-json{", "null", "[]", '"columns"', '{"name":"false"}'])(
        "ignores invalid stored value %s",
        (stored) => {
            sessionStorage.setItem("table-1", stored);
            const { result } = renderHook(() => useColumnVisibility("table-1", DEFAULTS));
            expect(result.current.columnVisibility).toEqual(DEFAULTS);
        }
    );

    it("reloads the model when the storage key changes without a remount", () => {
        sessionStorage.setItem("project-1", JSON.stringify({ name: false, actions: true }));
        const { result, rerender } = renderHook(({ key }) => useColumnVisibility(key, DEFAULTS), {
            initialProps: { key: "project-1" },
        });
        expect(result.current.columnVisibility).toEqual({ name: false, actions: true });

        rerender({ key: "project-2" });
        expect(result.current.columnVisibility).toEqual(DEFAULTS);

        act(() => result.current.toggleColumnVisibility("actions"));
        expect(JSON.parse(sessionStorage.getItem("project-2")!)).toEqual({ name: true, actions: false });
        expect(JSON.parse(sessionStorage.getItem("project-1")!)).toEqual({ name: false, actions: true });
    });
});
