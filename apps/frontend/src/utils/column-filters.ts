/**
 * Applies the per-column filter inputs to a row set in JS.
 *
 * The community DataGrid only ever applies the first item of a controlled
 * `filterModel` (multiple filter items are a Pro feature), so the tables
 * filter their rows before handing them to the grid instead.
 */
export const applyColumnFilters = <T>(
    rows: T[],
    columnFilters: Record<string, string>,
    valueGetters: Partial<Record<string, (row: T) => string>> = {},
    // Exact-match predicates for fields where a contains match is wrong (e.g. enum-like
    // filters whose tokens are substrings of each other). Receives the normalized
    // (trimmed, lowercased) filter value.
    matchers: Partial<Record<string, (row: T, filterValue: string) => boolean>> = {}
): T[] => {
    const activeFilters = Object.entries(columnFilters)
        .map(([field, value]) => [field, value.trim().toLowerCase()] as const)
        .filter(([, value]) => value !== "");
    if (activeFilters.length === 0) {
        return rows;
    }
    return rows.filter((row) =>
        activeFilters.every(([field, filterValue]) => {
            const matcher = matchers[field];
            if (matcher) {
                return matcher(row, filterValue);
            }
            const value = valueGetters[field]?.(row) ?? String((row as Record<string, unknown>)[field] ?? "");
            return value.toLowerCase().includes(filterValue);
        })
    );
};
