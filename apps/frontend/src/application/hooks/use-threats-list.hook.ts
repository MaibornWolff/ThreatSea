/*
 * LEGACY HOOK — `useThreatsList`
 *
 * Purpose:
 * - Wrapper around the legacy `useThreats` hook that provides list helpers (sorting/search).
 * - Kept to support the legacy tab on the Threats page; the page imports `useThreatsList`.
 *
 * Where referenced:
 * - apps/frontend/src/view/pages/threats.page.tsx
 *
 * Caution before deletion:
 * - If you remove this file, ensure all uses are migrated to the new model and tests are updated.
 * - Consider disabling the legacy tab in the UI first and running the test/dev build to detect references.
 *
 * Migration notes:
 * - New model functions are provided by `useGenericThreatsList` and related child-threat hooks.
 * 
 * samething as for the use-threats.hook.ts, it may be relevant for the new table ui but not for the model rework
 */

import { useEffect, useMemo } from "react";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { useList } from "./use-list.hooks";
import { useThreats } from "./use-threats.hook";

export type ThreatListItem = ExtendedThreat & {
    risk: number;
    damage: number;
};

const sortableThreatFields: (keyof Pick<
    ThreatListItem,
    | "name"
    | "assets"
    | "componentName"
    | "pointOfAttack"
    | "attacker"
    | "probability"
    | "damage"
    | "risk"
    | "doneEditing"
>)[] = ["name", "assets", "componentName", "pointOfAttack", "attacker", "probability", "damage", "risk", "doneEditing"];
type ThreatSortField = (typeof sortableThreatFields)[number];

const searchableThreatFields: (keyof Pick<
    ExtendedThreat,
    "name" | "description" | "componentName" | "attacker" | "pointOfAttack"
>)[] = ["name", "description", "componentName", "attacker", "pointOfAttack"];

export const useThreatsList = ({ projectId }: { projectId: number }) => {
    const { isPending, items, loadThreats, deleteThreat, duplicateThreat } = useThreats({
        projectId,
    });
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("threats");

    useEffect(() => {
        loadThreats();
    }, [projectId, loadThreats]);

    const filteredItems: ExtendedThreat[] = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch =
                searchableThreatFields.some((searchField) =>
                    String(item[searchField] ?? "")
                        .replace(/_/g, " ")
                        .toLowerCase()
                        .includes(searchValue.toLowerCase())
                ) || `${item.id}` == searchValue;

            return matchesSearch;
        });
    }, [items, searchValue]);

    const transformedItems = useMemo<ThreatListItem[]>(() => {
        return filteredItems.map((item) => {
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
    }, [filteredItems]);

    const sortedItems = useMemo(() => {
        const sortField: ThreatSortField = sortableThreatFields.includes(sortBy as ThreatSortField)
            ? (sortBy as ThreatSortField)
            : "name";

        return transformedItems.sort((a, b) => {
            if (sortDirection === "asc") {
                return (a[sortField] ?? "") < (b[sortField] ?? "") ? -1 : 1;
            } else {
                return (a[sortField] ?? "") > (b[sortField] ?? "") ? -1 : 1;
            }
        });
    }, [transformedItems, sortBy, sortDirection]);

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        deleteThreat,
        duplicateThreat,
        loadThreats,
        sortDirection,
        searchValue,
        sortBy,
        isPending,
        threats: sortedItems,
    };
};
