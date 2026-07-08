import { useEffect, useMemo } from "react";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { ExtendedChildThreat } from "#api/types/child-threat.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { useChildThreats } from "./use-child-threats.hook";
import { useMeasureImpacts } from "./use-measureImpacts.hook";
import { useList } from "./use-list.hooks";

export interface MeasureThreat {
    measureImpactId: number;
    setsOutOfScope: boolean;
    netProbability: number | null;
    netDamage: number | null;
    childThreatId: number | undefined;
    threatName: string | undefined;
    threatDescription: string | undefined;
    componentName: string | null;
    threat: ExtendedChildThreat | undefined;
    editThreat: ExtendedThreat | undefined;
    measureImpact: MeasureImpact;
}

const sortableFields: (keyof Pick<MeasureThreat, "threatName" | "componentName" | "netProbability" | "netDamage">)[] = [
    "threatName",
    "componentName",
    "netProbability",
    "netDamage",
];
type MeasureThreatSortField = (typeof sortableFields)[number];

const searchableFields: (keyof Pick<MeasureThreat, "threatName" | "threatDescription">)[] = [
    "threatName",
    "threatDescription",
];

export const useMeasureThreatsList = ({ projectId, measureId }: { projectId: number; measureId: number }) => {
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } =
        useList("measureThreats");

    //necessary data
    const { items: childThreats, loadChildThreats, isPending: childThreatsPending } = useChildThreats({ projectId });

    useEffect(() => {
        loadChildThreats();
    }, [projectId, loadChildThreats]);

    const {
        items: measureImpacts,
        loadMeasureImpacts,
        deleteMeasureImpact,
        isPending: measureImpactsPending,
    } = useMeasureImpacts({ projectId });

    useEffect(() => {
        loadMeasureImpacts();
    }, [projectId, loadMeasureImpacts]);

    const items: MeasureThreat[] = useMemo(() => {
        if (childThreatsPending || measureImpactsPending) {
            //wait until all data is loaded
            return [];
        }
        return measureImpacts
            .filter((measureImpact) => measureImpact.measureId === measureId)
            .map((measureImpact) => {
                const threat = childThreats.find((item) => item.id === measureImpact.childThreatId);

                const editThreat = threat
                    ? {
                          id: threat.id,
                          pointOfAttackId: threat.pointOfAttackId,
                          catalogThreatId: threat.genericThreatId,
                          name: threat.name,
                          description: threat.description,
                          pointOfAttack: threat.pointOfAttack,
                          attacker: threat.attacker,
                          probability: threat.probability,
                          confidentiality: threat.confidentiality,
                          integrity: threat.integrity,
                          availability: threat.availability,
                          doneEditing: threat.doneEditing,
                          projectId: threat.projectId,
                          createdAt: new Date(threat.createdAt),
                          updatedAt: new Date(threat.updatedAt),
                          componentName: threat.componentName,
                          componentType: threat.componentType,
                          interfaceName: threat.interfaceName,
                          assets: threat.assets,
                      }
                    : undefined;

                return {
                    measureImpactId: measureImpact.id,
                    setsOutOfScope: measureImpact.setsOutOfScope,
                    netProbability: measureImpact.probability,
                    netDamage: measureImpact.damage,
                    childThreatId: threat?.id,
                    threatName: threat?.name,
                    threatDescription: threat?.description,
                    componentName: threat?.componentName ?? null,
                    threat,
                    editThreat,
                    measureImpact,
                };
            });
    }, [measureImpacts, childThreats, childThreatsPending, measureImpactsPending, measureId]);

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
