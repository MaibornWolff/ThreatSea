import { act, renderHook } from "@testing-library/react";
import { useColumnFilters } from "./use-column-filters.hook";

describe("useColumnFilters", () => {
    it("collapses an untouched (default-expanded) filter on the first toggle", () => {
        const { result } = renderHook(() => useColumnFilters());
        expect(result.current.expandedFilters["name"]).toBeUndefined();

        act(() => result.current.toggleFilterExpanded("name"));
        expect(result.current.expandedFilters["name"]).toBe(false);

        act(() => result.current.toggleFilterExpanded("name"));
        expect(result.current.expandedFilters["name"]).toBe(true);
    });

    it("stores filter values per field and clears them all at once", () => {
        const { result } = renderHook(() => useColumnFilters());

        act(() => result.current.handleFilterChange("name", "abc"));
        act(() => result.current.handleFilterChange("email", "x"));
        expect(result.current.columnFilters).toEqual({ name: "abc", email: "x" });

        act(() => result.current.clearColumnFilters());
        expect(result.current.columnFilters).toEqual({});
    });
});
