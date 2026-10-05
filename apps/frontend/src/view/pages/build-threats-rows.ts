import type { TFunction } from "i18next";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import {
    formatComponentName,
    GENERIC_THREAT_ROW_PREFIX,
    THREAT_ROW_PREFIX,
    type ThreatsGridRow,
} from "./create-threats-columns";

// Fields whose values only exist on threats; a filter on them can never
// match a generic threat directly.
const threatOnlyFilterFields = ["description", "assets", "probability", "damage", "risk", "status"] as const;

interface ActiveFilter {
    field: string;
    // the raw value, for exact matches (status)
    value: string;
    // trimmed and lower-cased, for substring matches
    search: string;
}

const threatMatchesFilter = (
    threat: ExtendedThreatWithMetrics,
    { field, value, search }: ActiveFilter,
    t: TFunction
) => {
    switch (field) {
        case "name":
            return threat.name.toLowerCase().includes(search);
        case "description":
            return threat.description.toLowerCase().includes(search);
        case "assets":
            return String(threat.assets.length).includes(search);
        case "componentName":
            return formatComponentName(threat, t).toLowerCase().includes(search);
        case "pointOfAttack":
            return t(`pointsOfAttackList.${threat.pointOfAttack}`).toLowerCase().includes(search);
        case "attacker":
            return t(`attackerList.${threat.attacker}`).toLowerCase().includes(search);
        case "probability":
            return String(threat.probability).includes(search);
        case "damage":
            return String(threat.damage).includes(search);
        case "risk":
            return String(threat.risk).includes(search);
        case "status":
            return threat.status === value;
        default:
            return true;
    }
};

// undefined for fields a generic threat has no value for (the threat-only fields).
const genericThreatMatchesFilter = (
    genericThreat: GenericThreatWithExtendedThreats,
    { field, search }: ActiveFilter,
    t: TFunction
): boolean | undefined => {
    switch (field) {
        case "name":
            return genericThreat.name.toLowerCase().includes(search);
        case "componentName":
            return formatComponentName(genericThreat, t).toLowerCase().includes(search);
        case "pointOfAttack":
            return t(`pointsOfAttackList.${genericThreat.pointOfAttack}`).toLowerCase().includes(search);
        case "attacker":
            return t(`attackerList.${genericThreat.attacker}`).toLowerCase().includes(search);
        default:
            return undefined;
    }
};

export interface ThreatsPagination {
    page: number;
    pageSize: number;
}

interface ThreatGroup {
    genericThreat: GenericThreatWithExtendedThreats;
    visibleThreats: ExtendedThreatWithMetrics[];
    totalThreatCount: number;
}

/**
 * Flattens the generic threats and their threats into the grid's rows. The grid's own filtering and
 * pagination would treat generic threat and threat rows independently and tear the hierarchy apart,
 * so both are done here, on whole groups: filter, then take the page's generic threats with all of
 * their threats.
 *
 * A generic threat that matches a filter on its own columns (e.g. its name) passes that filter on
 * for its threats, so searching for a generic threat lists all of its threats rather than an empty
 * group. Threat-only filters (e.g. status) still apply to each threat.
 *
 * @returns the page's rows, and how many generic threats match the filters on all pages.
 */
export const buildThreatsRows = ({
    genericThreats,
    threatsByGenericThreatId,
    expandedGenericThreatIds,
    columnFilters,
    page,
    t,
}: {
    genericThreats: GenericThreatWithExtendedThreats[];
    threatsByGenericThreatId: Record<number, ExtendedThreatWithMetrics[]>;
    expandedGenericThreatIds: Record<number, boolean>;
    columnFilters: Record<string, string>;
    page: ThreatsPagination;
    t: TFunction;
}): { rows: ThreatsGridRow[]; genericThreatCount: number } => {
    const activeFilters: ActiveFilter[] = Object.entries(columnFilters)
        .map(([field, value]) => ({ field, value, search: value.trim().toLowerCase() }))
        .filter((filter) => filter.search !== "");
    const hasThreatOnlyFilter = activeFilters.some((filter) =>
        (threatOnlyFilterFields as readonly string[]).includes(filter.field)
    );

    const groups: ThreatGroup[] = [];
    for (const genericThreat of genericThreats) {
        const threats = threatsByGenericThreatId[genericThreat.id] ?? [];
        const genericThreatMatches = activeFilters.map(
            (filter) => genericThreatMatchesFilter(genericThreat, filter, t) === true
        );
        const visibleThreats = threats.filter((threat) =>
            activeFilters.every(
                (filter, index) => genericThreatMatches[index] || threatMatchesFilter(threat, filter, t)
            )
        );

        // A generic threat without threats can still match on its own columns.
        const genericThreatVisible =
            visibleThreats.length > 0 ||
            (!hasThreatOnlyFilter &&
                activeFilters.every((filter) => genericThreatMatchesFilter(genericThreat, filter, t) ?? true));
        if (genericThreatVisible) {
            groups.push({ genericThreat, visibleThreats, totalThreatCount: threats.length });
        }
    }

    const pageStart = page.page * page.pageSize;
    const pageGroups = groups.slice(pageStart, pageStart + page.pageSize);

    const rows: ThreatsGridRow[] = [];
    for (const { genericThreat, visibleThreats, totalThreatCount } of pageGroups) {
        const isExpanded = expandedGenericThreatIds[genericThreat.id] ?? false;
        rows.push({
            rowType: "genericThreat",
            rowId: `${GENERIC_THREAT_ROW_PREFIX}${genericThreat.id}`,
            genericThreat,
            threatCount: visibleThreats.length,
            totalThreatCount,
            isExpanded,
        });
        if (isExpanded) {
            if (visibleThreats.length === 0) {
                rows.push({ rowType: "noThreats", rowId: `empty-${genericThreat.id}` });
            } else {
                for (const threat of visibleThreats) {
                    rows.push({
                        rowType: "threat",
                        rowId: `${THREAT_ROW_PREFIX}${threat.id}`,
                        threat,
                    });
                }
            }
        }
    }
    return { rows, genericThreatCount: groups.length };
};
