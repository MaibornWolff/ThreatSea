import { useMemo } from "react";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { useThreats } from "./use-threats.hook";

export type ThreatListItem = ExtendedThreat & {
    risk: number;
    damage: number;
};

export const useThreatsList = ({ projectId }: { projectId: number }) => {
    const { isPending, items, loadThreats, deleteThreat, duplicateThreat } = useThreats({
        projectId,
    });

    const transformedItems = useMemo<ThreatListItem[]>(() => {
        return items.map((item) => {
            const { confidentiality, integrity, availability, probability, assets } = item;
            const damage = assets.reduce((value, asset) => {
                if (confidentiality && value < asset.confidentiality) {
                    value = asset.confidentiality;
                }
                if (integrity && value < asset.integrity) {
                    value = asset.integrity;
                }
                if (availability && value < asset.availability) {
                    value = asset.availability;
                }
                return value;
            }, 0); // default 0 for not affected protection goals
            const risk = probability * damage;
            return {
                ...item,
                risk,
                damage,
                assets,
            };
        });
    }, [items]);

    // Deterministic initial order; searching and per-column sorting are handled by the data grid.
    const sortedItems = useMemo(
        () => transformedItems.toSorted((a, b) => (a.name < b.name ? -1 : 1)),
        [transformedItems]
    );

    return {
        deleteThreat,
        duplicateThreat,
        loadThreats,
        isPending,
        threats: sortedItems,
    };
};
