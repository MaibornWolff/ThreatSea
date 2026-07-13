import { useCallback, useEffect, useMemo, useState } from "react";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { calcDamage } from "#utils/helpers.ts";

export type ExtendedThreatWithMetrics = ExtendedThreat & {
    damage: number;
    risk: number;
};

export const useGenericThreatsList = ({ projectId }: { projectId: number }) => {
    const [isPending, setIsPending] = useState<boolean>(false);
    const [genericThreats, setGenericThreats] = useState<GenericThreatWithExtendedChildren[]>([]);
    const [searchValue, setSearchValue] = useState<string>("");

    const [expandedGenericThreatIds, setExpandedGenericThreatIds] = useState<Record<number, boolean>>({});
    const [threatsByGenericThreatId, setThreatsByGenericThreatId] = useState<
        Record<number, ExtendedThreatWithMetrics[]>
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

            if (sortedThreats.length === 0) {
                setThreatsByGenericThreatId({});
                setLoadingChildrenByGenericThreatId({});
                return;
            }

            const threatsMap = sortedThreats.reduce<Record<number, ExtendedThreatWithMetrics[]>>((result, threat) => {
                result[threat.id] = threat.children.map((threat) => {
                    const damage = calcDamage(threat);
                    return {
                        ...threat,
                        damage,
                        risk: threat.probability * damage,
                    };
                });
                return result;
            }, {});
            setThreatsByGenericThreatId(threatsMap);

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

            const threats = threatsByGenericThreatId[genericThreat.id] ?? [];
            return threats.some(
                (threat) =>
                    threat.name.toLowerCase().includes(normalizedSearch) ||
                    threat.description.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [threatsByGenericThreatId, genericThreats, searchValue]);

    return {
        isPending,
        searchValue,
        setSearchValue,
        loadGenericThreats,
        genericThreats: filteredGenericThreats,
        expandedGenericThreatIds,
        threatsByGenericThreatId,
        loadingChildrenByGenericThreatId,
        toggleGenericThreat,
    };
};
