import { useCallback, useState } from "react";

/**
 * Per-column filter inputs for a table: the filter text per field and which
 * filter headers are expanded. Filters are expanded by default (fields without
 * an entry count as open — user feedback: collapsed filters were hard to
 * discover); the header chevron collapses them per column. The values feed
 * applyColumnFilters (or the threats page's hierarchy-aware filtering).
 */
export const useColumnFilters = () => {
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

    const handleFilterChange = useCallback((field: string, value: string) => {
        setColumnFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleFilterExpanded = useCallback((field: string) => {
        setExpandedFilters((prev) => ({ ...prev, [field]: !(prev[field] ?? true) }));
    }, []);

    const clearColumnFilters = useCallback(() => {
        setColumnFilters({});
    }, []);

    return { columnFilters, expandedFilters, handleFilterChange, toggleFilterExpanded, clearColumnFilters };
};
