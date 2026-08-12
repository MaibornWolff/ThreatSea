import { useCallback, useState } from "react";

/**
 * Per-column filter inputs for a table: the filter text per field and which
 * filter headers are expanded. The values feed applyColumnFilters (or the
 * threats page's hierarchy-aware filtering).
 */
export const useColumnFilters = () => {
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

    const handleFilterChange = useCallback((field: string, value: string) => {
        setColumnFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleFilterExpanded = useCallback((field: string) => {
        setExpandedFilters((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const clearColumnFilters = useCallback(() => {
        setColumnFilters({});
    }, []);

    return { columnFilters, expandedFilters, handleFilterChange, toggleFilterExpanded, clearColumnFilters };
};
