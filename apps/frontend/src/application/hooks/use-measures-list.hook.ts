import { useEffect, useMemo } from "react";
import type { Measure } from "#api/types/measure.types.ts";
import { useMeasures } from "./use-measures.hook";

export const useMeasuresList = ({ projectId }: { projectId: number }) => {
    const { isPending, items, loadMeasures, deleteMeasure } = useMeasures({
        projectId,
    });

    useEffect(() => {
        loadMeasures();
    }, [projectId, loadMeasures]);

    // Deterministic initial order; searching and per-column sorting are handled by the data grid.
    const sortedItems = useMemo(
        () => items.toSorted((a: Measure, b: Measure) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)),
        [items]
    );

    return {
        deleteMeasure,
        isPending,
        measures: sortedItems,
    };
};
