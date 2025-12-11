import { useEffect, useMemo } from "react";
import type { Measure } from "#api/types/measure.types.ts";
import { socket } from "../../api/system-socket.api";
import { useMeasures } from "./use-measures.hook";
import { useList } from "./use-list.hooks";

type MeasureSortField = keyof Pick<Measure, "name" | "scheduledAt">;

const searchableMeasureFields: (keyof Pick<Measure, "name" | "description">)[] = ["name", "description"];

export const useMeasuresList = ({ projectId }: { projectId: number }) => {
    const { isPending, items, loadMeasures, deleteMeasure } = useMeasures({
        projectId,
    });
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("measures");

    useEffect(() => {
        loadMeasures();
    }, [projectId, loadMeasures]);

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

    const filteredItems: Measure[] = useMemo(
        () =>
            items.filter((item) => {
                return (
                    searchableMeasureFields.some((searchField) =>
                        item[searchField].toLowerCase().includes(searchValue.toLowerCase())
                    ) || `${item.id}` == searchValue
                );
            }),
        [items, searchValue]
    );

    const sortedItems: Measure[] = useMemo(() => {
        const sortField: MeasureSortField = ["name", "scheduledAt"].includes(sortBy as MeasureSortField)
            ? (sortBy as MeasureSortField)
            : "name";

        return filteredItems.sort((a, b) => {
            if (sortDirection === "asc") {
                if (typeof a[sortField] === "string" && typeof b[sortField] === "string") {
                    return a[sortField].toLowerCase() < b[sortField].toLowerCase() ? -1 : 1;
                } else {
                    return a[sortField] < b[sortField] ? -1 : 1;
                }
            } else {
                if (typeof a[sortField] === "string" && typeof b[sortField] === "string") {
                    return a[sortField].toLowerCase() > b[sortField].toLowerCase() ? -1 : 1;
                } else {
                    return a[sortField] > b[sortField] ? -1 : 1;
                }
            }
        });
    }, [filteredItems, sortBy, sortDirection]);

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
