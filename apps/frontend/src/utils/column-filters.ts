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
    valueGetters: Partial<Record<string, (row: T) => string>> = {}
): T[] => {
    const activeFilters = Object.entries(columnFilters)
        .map(([field, value]) => [field, value.trim().toLowerCase()] as const)
        .filter(([, value]) => value !== "");
    if (activeFilters.length === 0) {
        return rows;
    }
    return rows.filter((row) =>
        activeFilters.every(([field, filterValue]) => {
            const value = valueGetters[field]?.(row) ?? String((row as Record<string, unknown>)[field] ?? "");
            return value.toLowerCase().includes(filterValue);
        })
    );
};
