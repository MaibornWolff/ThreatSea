import { useEffect, useMemo } from "react";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { useThreats } from "./use-threats.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useList } from "./use-list.hooks";

interface MeasureThreatListItem {
    measureImpactId: number;
    setsOutOfScope: boolean;
    netProbability: number | null;
    netDamage: number | null;
    threatId: number | undefined;
    threatName: string | undefined;
    threatDescription: string | undefined;
    componentName: string | null;
    threat: ExtendedThreat | undefined;
    measureImpact: MeasureImpact;
}

const sortableFields: (keyof Pick<
    MeasureThreatListItem,
    "threatName" | "componentName" | "netProbability" | "netDamage"
>)[] = ["threatName", "componentName", "netProbability", "netDamage"];
type MeasureThreatSortField = (typeof sortableFields)[number];

const searchableFields: (keyof Pick<MeasureThreatListItem, "threatName" | "threatDescription">)[] = [
    "threatName",
    "threatDescription",
];

export const useMeasureThreatsList = ({ projectId, measureId }: { projectId: number; measureId: number }) => {
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

    const items: MeasureThreatListItem[] = useMemo(() => {
        if (threatsPending || measureImpactsPending) {
            //wait until all data is loaded
            return [];
        }
        return measureImpacts
            .filter((measureImpact) => measureImpact.measureId === measureId)
            .map((measureImpact) => {
                const threat = threats.find((item) => item.id === measureImpact.threatId);
                return {
                    measureImpactId: measureImpact.id,
                    setsOutOfScope: measureImpact.setsOutOfScope,
                    netProbability: measureImpact.probability,
                    netDamage: measureImpact.damage,
                    threatId: threat?.id,
                    threatName: threat?.name,
                    threatDescription: threat?.description,
                    componentName: threat?.componentName ?? null,
                    threat,
                    measureImpact,
                };
            });
    }, [measureImpacts, threats, threatsPending, measureImpactsPending, measureId]);

    const filteredItems = useMemo(() => {
        return items.filter((item) =>
            searchableFields.some((field) => item?.[field]?.toLowerCase().includes(searchValue.toLowerCase()))
        );
    }, [items, searchValue]);

    const sortedItems = useMemo(() => {
        const sortField = sortableFields.includes(sortBy as MeasureThreatSortField)
            ? (sortBy as MeasureThreatSortField)
            : "threatName";

        return filteredItems.sort((a, b) => {
            if (sortDirection === "asc") {
                if (sortField === "threatName") {
                    return (a[sortField] ?? "").toLowerCase() < (b[sortField] ?? "").toLowerCase() ? -1 : 1;
                } else {
                    return new Date(a[sortField] ?? "") < new Date(b[sortField] ?? "") ? -1 : 1;
                }
            } else {
                if (sortField === "threatName") {
                    return (a[sortField] ?? "").toLowerCase() > (b[sortField] ?? "").toLowerCase() ? -1 : 1;
                } else {
                    return new Date(a[sortField] ?? "") > new Date(b[sortField] ?? "") ? -1 : 1;
                }
            }
        });
    }, [filteredItems, sortBy, sortDirection]);

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
