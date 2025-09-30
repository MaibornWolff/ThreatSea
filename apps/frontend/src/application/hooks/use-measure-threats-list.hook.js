/**
 * @module use-measure-threats-list.hook - Custom hook
 *     for the asset lists.
 */

import { useEffect, useMemo } from "react";
import { useThreats } from "./use-threats.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useList } from "./use-list.hooks";

/**
 * Creates a Custom Hook for the list of threats for a measure.
 * @param {number} projectId - id of the current project.
 * @param {number} measureId - id of the current measure
 * @returns {{measureThreats: {
 *                     measureImpactId,
 *                     netProbability,
 *                     netDamage,
 *                     threatId,
 *                     threatName,
 *                     threatDescription}}[]} list of Threats the measure impacts
 */
export const useMeasureThreatsList = ({ projectId, measureId }) => {
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } =
        useList("measureThreats");

    //necessary data
    const { items: threats, loadThreats, isPending: threatsPending } = useThreats({ projectId });

    useEffect(() => {
        loadThreats();
    }, [projectId, loadThreats]);

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
        if (threatsPending || measureImpactsPending) {
            //wait until all data is loaded
            return [];
        }
        return measureImpacts
            .filter((measureImpact) => measureImpact.measureId === measureId)
            .map((measureImpact) => {
                const threat = threats.find((threat) => {
                    return threat.id === measureImpact.threatId;
                });
                return {
                    measureImpactId: measureImpact.id,
                    setsOutOfScope: measureImpact.setsOutOfScope,
                    netProbability: measureImpact.probability,
                    netDamage: measureImpact.damage,
                    threatId: threat.id,
                    threatName: threat.name,
                    threatDescription: threat.description,
                    componentName: threat.componentName,
                    threat: threat,
                    measureImpact: measureImpact,
                };
            });
    }, [measureImpacts, threats, threatsPending, measureImpactsPending, measureId]);

    /**
     * Filters the assets by the given search value.
     * Always triggers when the assets or the searchvalue change.
     */
    const filteredItems = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return ["threatName", "threatDescription"].some((searchField) =>
                    item[searchField].toLowerCase().includes(lcSearchValue)
                );
            }),
        [items, searchValue]
    );

    const sortedItems = useMemo(
        () =>
            filteredItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (sortBy === "threatName") {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) < new Date(b[sortBy]) ? -1 : 1;
                    }
                } else {
                    if (sortBy === "threatName") {
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
        measureThreats: sortedItems,
    };
};
