import type { TFunction } from "i18next";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
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

export type ThreatsSortField =
    | "name"
    | "description"
    | "assets"
    | "componentName"
    | "pointOfAttack"
    | "attacker"
    | "probability"
    | "damage"
    | "risk"
    | "status";

export interface ThreatsSort {
    field: ThreatsSortField;
    direction: "asc" | "desc";
}

export interface ThreatsPagination {
    page: number;
    pageSize: number;
}

// Columns a generic threat has a value for itself; its threats inherit all of them except the name.
const genericThreatSortFields: readonly ThreatsSortField[] = ["name", "componentName", "pointOfAttack", "attacker"];

/** Whether a sort column only has values on threat rows, so the generic threat rows don't show them. */
export const isThreatOnlySortField = (field: string): boolean =>
    !(genericThreatSortFields as readonly string[]).includes(field);

// Workflow order, so ascending lists open work first.
const statusRank: Record<THREAT_STATUSES, number> = {
    [THREAT_STATUSES.NEW]: 0,
    [THREAT_STATUSES.IN_PROGRESS]: 1,
    [THREAT_STATUSES.FINALIZED]: 2,
    [THREAT_STATUSES.OUTOFSCOPE]: 3,
};

const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });

const compareValues = (a: string | number, b: string | number) =>
    typeof a === "number" && typeof b === "number" ? a - b : compareText(String(a), String(b));

const genericThreatSortValue = (
    genericThreat: GenericThreatWithExtendedThreats,
    field: ThreatsSortField,
    t: TFunction
): string => {
    switch (field) {
        case "componentName":
            return formatComponentName(genericThreat, t);
        case "pointOfAttack":
            return t(`pointsOfAttackList.${genericThreat.pointOfAttack}`);
        case "attacker":
            return t(`attackerList.${genericThreat.attacker}`);
        default:
            return genericThreat.name;
    }
};

const threatSortValue = (threat: ExtendedThreatWithMetrics, field: ThreatsSortField, t: TFunction): string | number => {
    switch (field) {
        case "description":
            return threat.description;
        case "assets":
            return threat.assets.length;
        case "componentName":
            return formatComponentName(threat, t);
        case "pointOfAttack":
            return t(`pointsOfAttackList.${threat.pointOfAttack}`);
        case "attacker":
            return t(`attackerList.${threat.attacker}`);
        case "probability":
            return threat.probability;
        case "damage":
            return threat.damage;
        case "risk":
            return threat.risk;
        case "status":
            return statusRank[threat.status];
        default:
            return threat.name;
    }
};

interface ThreatGroup {
    genericThreat: GenericThreatWithExtendedThreats;
    visibleThreats: ExtendedThreatWithMetrics[];
    totalThreatCount: number;
}

// Sorts the threats within each group, then the groups: by the generic threat's own value for its
// columns, otherwise by each group's top threat (its first threat in the sort direction), so e.g.
// risk descending lists the generic threat with the riskiest threat first. Ties fall back to the name.
const sortGroups = (groups: ThreatGroup[], { field, direction }: ThreatsSort, t: TFunction): ThreatGroup[] => {
    const sign = direction === "asc" ? 1 : -1;
    const compareThreats = (a: ExtendedThreatWithMetrics, b: ExtendedThreatWithMetrics) =>
        sign * compareValues(threatSortValue(a, field, t), threatSortValue(b, field, t)) || compareText(a.name, b.name);
    const sorted = groups.map((group) => ({
        ...group,
        visibleThreats: [...group.visibleThreats].sort(compareThreats),
    }));

    const compareGroupsByName = (a: ThreatGroup, b: ThreatGroup) =>
        compareText(a.genericThreat.name, b.genericThreat.name);
    if (genericThreatSortFields.includes(field)) {
        return sorted.sort(
            (a, b) =>
                sign *
                    compareText(
                        genericThreatSortValue(a.genericThreat, field, t),
                        genericThreatSortValue(b.genericThreat, field, t)
                    ) || compareGroupsByName(a, b)
        );
    }
    return sorted.sort((a, b) => {
        const topA = a.visibleThreats[0];
        const topB = b.visibleThreats[0];
        // a group without listed threats has nothing to rank by, so it goes last
        if (!topA && !topB) {
            return compareGroupsByName(a, b);
        }
        if (!topA) {
            return 1;
        }
        if (!topB) {
            return -1;
        }
        return compareThreats(topA, topB) || compareGroupsByName(a, b);
    });
};

/**
 * Flattens the generic threats and their threats into the grid's rows. The grid's own filtering,
 * sorting and pagination would treat generic threat and threat rows independently and tear the
 * hierarchy apart, so all three are done here, on whole groups: filter, then sort, then take the
 * page's generic threats with all of their threats.
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
    sort,
    page,
    t,
}: {
    genericThreats: GenericThreatWithExtendedThreats[];
    threatsByGenericThreatId: Record<number, ExtendedThreatWithMetrics[]>;
    expandedGenericThreatIds: Record<number, boolean>;
    columnFilters: Record<string, string>;
    sort: ThreatsSort;
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
    const pageGroups = sortGroups(groups, sort, t).slice(pageStart, pageStart + page.pageSize);

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
