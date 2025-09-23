/**
 * @module use-threat-measures-list.hook - Custom hook
 *     for the threat measures lists.
 */

import { useEffect, useMemo } from "react";
import { useMeasures } from "./use-measures.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useList } from "./use-list.hooks";
import { useMeasuresList } from "./use-measures-list.hook";

/**
 * Creates a Custom Hook for the list of measures for a threat.
 * @param {number} projectId - id of the current project.
 * @param {number} threatId - id of the current threat
 * @returns {{threatMeasures: {
 *                     measureId,
 *                     measureName,
 *                     scheduleDate}}[]} list of measures that impact the threat
 */
export const useThreatMeasuresList = ({ projectId, threatId }) => {
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } =
        useList("threatMeasures");

    projectId = parseInt(projectId);

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

    const items = useMemo(() => {
        if (measuresPending || measureImpactsPending) {
            //wait until all data is loaded
            return [];
        }

        return measureImpacts
            .filter((measureImpact) => measureImpact.threatId === threatId)
            .map((measureImpact) => {
                const measure = measures.find((measure) => {
                    return measure.id === measureImpact.measureId;
                });

                return {
                    measureImpactId: measureImpact.id,
                    setsOutOfScope: measureImpact.setsOutOfScope,
                    netProbability: measureImpact.probability,
                    netDamage: measureImpact.damage,
                    measureId: measure.id,
                    measureName: measure.name,
                    measureScheduleAt: measure.scheduledAt,
                    measure: measure,
                    measureImpact: measureImpact,
                };
            });
    }, [measureImpacts, measures, measuresPending, measureImpactsPending, threatId]);

    /**
     * Filters the measures by the given search value.
     * Always triggers when the measures or the searchvalue change.
     */
    const filteredItems = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return ["measureName", "measureScheduleAt"].some((searchField) =>
                    item[searchField]?.toLowerCase().includes(lcSearchValue)
                );
            }),
        [items, searchValue]
    );

    const sortedItems = useMemo(
        () =>
            filteredItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (sortBy === "measureName") {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) < new Date(b[sortBy]) ? -1 : 1;
                    }
                } else {
                    if (sortBy === "measureName") {
                        return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) > new Date(b[sortBy]) ? -1 : 1;
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
