/**
 * @module use-measures-list.hook - Custom hook
 *     for the asset lists.
 */

import { useEffect, useMemo } from "react";
import { socket } from "../../api/system-socket.api";
import { useMeasures } from "./use-measures.hook";
import { useList } from "./use-list.hooks";

/**
 * Creates a custom hook for the measures list.
 * @param {number} projectId - id of the current project.
 * @returns Asset list hook.
 */

export const useMeasuresList = ({ projectId }) => {
    const { isPending, items, loadMeasures, deleteMeasure } = useMeasures({
        projectId,
    });
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("measures");

    /**
     * Loads measures whenever the project changes
     * or new measures are added.
     */
    useEffect(() => {
        loadMeasures({ projectId });
    }, [projectId, loadMeasures]);

    /**
     * Filters the measures by the given search value.
     * Always triggers when the assets or the searchvalue change.
     */
    const filteredItems = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return (
                    ["name", "description"].some((searchField) =>
                        item[searchField].toLowerCase().includes(lcSearchValue)
                    ) || item.id == searchValue
                );
            }),
        [items, searchValue]
    );

    const sortedItems = useMemo(
        () =>
            filteredItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (a[sortBy]?.toLowerCase && b[sortBy]?.toLowerCase) {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return a[sortBy] < b[sortBy] ? -1 : 1;
                    }
                } else {
                    if (a[sortBy]?.toLowerCase && b[sortBy]?.toLowerCase) {
                        return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return a[sortBy] > b[sortBy] ? -1 : 1;
                    }
                }
            }),
        [filteredItems, sortBy, sortDirection]
    );

    /**
     * Emits through the socket api that someone is leaving.
     * Triggers always when the projectId is changing.
     */
    useEffect(() => {
        socket.emit(
            "change_project",
            JSON.stringify({
                projectId: projectId,
            })
        );
        return () => {
            socket.emit("leave_project", JSON.stringify({}));
        };
    }, [projectId]);

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        deleteMeasure,
        sortDirection,
        searchValue,
        sortBy,
        isPending,
        measures: sortedItems,
    };
};
