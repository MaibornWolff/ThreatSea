/**
 * @module use-threat-measures-list.hook - Custom hook
 *     for the threat measures lists.
 */

import { useEffect, useMemo } from "react";
import type { Measure } from "#api/types/measure.types.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import { useMeasures } from "./use-measures.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useList } from "./use-list.hooks";

export interface ThreatMeasure {
    measureImpactId: number;
    setsOutOfScope: boolean;
    netProbability: number | null;
    netDamage: number | null;
    measureId: number;
    measureName: string;
    measureScheduleAt: Date | null;
    threatName?: string;
    measure: Measure;
    measureImpact: MeasureImpact;
}

const searchableFields = ["measureName", "measureScheduleAt"] as const;
type SortableField = "measureName" | "measureScheduleAt" | "netProbability" | "netDamage";

interface UseThreatMeasuresListParams {
    projectId: number;
    threatId: number;
}

/**
 * Creates a Custom Hook for the list of measures for a threat.
 * @param {number} projectId - id of the current project.
 * @param {number} threatId - id of the current threat
 * @returns {{threatMeasures: {
 *                     measureId,
 *                     measureName,
 *                     scheduleDate}}[]} list of measures that impact the threat
 */
export const useThreatMeasuresList = ({ projectId, threatId }: UseThreatMeasuresListParams) => {
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } =
        useList("threatMeasures");

    //necessary data
    const { items: measures, loadMeasures, isPending: measuresPending } = useMeasures({ projectId });

    useEffect(() => {
        loadMeasures(); // <-- just like in your working example
    }, [projectId, loadMeasures]);

    const {
        items: measureImpacts,
        loadMeasureImpacts,
        deleteMeasureImpact,
        isPending: measureImpactsPending,
    } = useMeasureImpacts({ projectId });

    useEffect(() => {
        loadMeasureImpacts();
    }, [projectId, loadMeasureImpacts]);

    const items: ThreatMeasure[] = useMemo(() => {
        if (measuresPending || measureImpactsPending) {
            //wait until all data is loaded
            return [];
        }

        return measureImpacts.reduce<ThreatMeasure[]>((acc, measureImpact) => {
            if (measureImpact.threatId !== threatId) {
                return acc;
            }

            const measure = measures.find((item) => item.id === measureImpact.measureId);
            if (!measure) {
                return acc;
            }

            acc.push({
                measureImpactId: measureImpact.id,
                setsOutOfScope: measureImpact.setsOutOfScope,
                netProbability: measureImpact.probability,
                netDamage: measureImpact.damage,
                measureId: measure.id,
                measureName: measure.name,
                measureScheduleAt: measure.scheduledAt ?? null,
                measure,
                measureImpact,
            });

            return acc;
        }, []);
    }, [measureImpacts, measures, measuresPending, measureImpactsPending, threatId]);

    /**
     * Filters the measures by the given search value.
     * Always triggers when the measures or the searchvalue change.
     */
    const filteredItems: ThreatMeasure[] = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return searchableFields.some((searchField) => {
                    const value = item[searchField];
                    return typeof value === "string" ? value.toLowerCase().includes(lcSearchValue) : false;
                });
            }),
        [items, searchValue]
    );

    const sortedItems: ThreatMeasure[] = useMemo(
        () =>
            filteredItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (sortBy === "measureName") {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy as SortableField] ?? 0) < new Date(b[sortBy as SortableField] ?? 0)
                            ? -1
                            : 1;
                    }
                } else {
                    if (sortBy === "measureName") {
                        return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy as SortableField] ?? 0) > new Date(b[sortBy as SortableField] ?? 0)
                            ? -1
                            : 1;
                    }
                }
            }),
        [filteredItems, sortBy, sortDirection]
    );

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        deleteMeasureImpact,
        sortDirection,
        searchValue,
        sortBy,
        threatMeasures: sortedItems,
    };
};
