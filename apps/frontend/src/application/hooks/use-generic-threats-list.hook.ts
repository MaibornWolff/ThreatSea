import { useCallback, useEffect, useMemo, useState } from "react";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import type { ExtendedChildThreat } from "#api/types/child-threat.types.ts";

export const useGenericThreatsList = ({ projectId }: { projectId: number }) => {
    const [isPending, setIsPending] = useState<boolean>(false);
    const [genericThreats, setGenericThreats] = useState<GenericThreatWithExtendedChildren[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");

    const [expandedGenericThreatIds, setExpandedGenericThreatIds] = useState<Record<number, boolean>>({});
    const [childThreatsByGenericThreatId, setChildThreatsByGenericThreatId] = useState<
        Record<number, ExtendedChildThreat[]>
    >({});
    const [loadingChildrenByGenericThreatId, setLoadingChildrenByGenericThreatId] = useState<Record<number, boolean>>(
        {}
    );

    const loadGenericThreats = useCallback(async () => {
        setIsPending(true);
        try {
            const threats = await GenericThreatsAPI.getGenericThreatsWithExtendedChildren({ projectId });
            const sortedThreats = [...threats].sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
            );
            setGenericThreats(sortedThreats);
            setExpandedGenericThreatIds({});

            if (sortedThreats.length === 0) {
                setChildThreatsByGenericThreatId({});
                setLoadingChildrenByGenericThreatId({});
                return;
            }

            const childThreatsMap = sortedThreats.reduce<Record<number, ExtendedChildThreat[]>>((result, threat) => {
                result[threat.id] = threat.children;
                return result;
            }, {});
            setChildThreatsByGenericThreatId(childThreatsMap);

            const loadedState = sortedThreats.reduce<Record<number, boolean>>((result, threat) => {
                result[threat.id] = false;
                return result;
            }, {});
            setLoadingChildrenByGenericThreatId(loadedState);
        } finally {
            setIsPending(false);
        }
    }, [projectId]);

    useEffect(() => {
        void loadGenericThreats();
    }, [loadGenericThreats]);

    const toggleGenericThreat = useCallback(
        (genericThreatId: number) => {
            const shouldExpand = !expandedGenericThreatIds[genericThreatId];

            setExpandedGenericThreatIds((previous) => ({
                ...previous,
                [genericThreatId]: shouldExpand,
            }));
        },
        [expandedGenericThreatIds]
    );

    const filteredGenericThreats = useMemo(() => {
        const normalizedSearch = searchValue.toLowerCase().trim();

        if (!normalizedSearch) {
            return genericThreats;
        }

        return genericThreats.filter((genericThreat) => {
            const genericThreatMatches =
                genericThreat.name.toLowerCase().includes(normalizedSearch) ||
                genericThreat.description.toLowerCase().includes(normalizedSearch) ||
                genericThreat.attacker.toLowerCase().includes(normalizedSearch) ||
                genericThreat.pointOfAttack.toLowerCase().replace(/_/g, " ").includes(normalizedSearch);

            if (genericThreatMatches) {
                return true;
            }

            const childThreats = childThreatsByGenericThreatId[genericThreat.id] ?? [];
            return childThreats.some(
                (childThreat) =>
                    childThreat.name.toLowerCase().includes(normalizedSearch) ||
                    childThreat.description.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [childThreatsByGenericThreatId, genericThreats, searchValue]);

    return {
        isPending,
        searchValue,
        setSearchValue,
        loadGenericThreats,
        genericThreats: filteredGenericThreats,
        expandedGenericThreatIds,
        childThreatsByGenericThreatId,
        loadingChildrenByGenericThreatId,
        toggleGenericThreat,
    };
};
