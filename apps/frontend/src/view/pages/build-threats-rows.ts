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

const matchesThreatFilters = (
    threat: ExtendedThreatWithMetrics,
    columnFilters: Record<string, string>,
    t: TFunction
): boolean =>
    Object.entries(columnFilters).every(([field, value]) => {
        const filterValue = value.trim().toLowerCase();
        if (!filterValue) {
            return true;
        }
        switch (field) {
            case "name":
                return threat.name.toLowerCase().includes(filterValue);
            case "description":
                return threat.description.toLowerCase().includes(filterValue);
            case "assets":
                return String(threat.assets.length).includes(filterValue);
            case "componentName":
                return formatComponentName(threat, t).toLowerCase().includes(filterValue);
            case "pointOfAttack":
                return t(`pointsOfAttackList.${threat.pointOfAttack}`).toLowerCase().includes(filterValue);
            case "attacker":
                return t(`attackerList.${threat.attacker}`).toLowerCase().includes(filterValue);
            case "probability":
                return String(threat.probability).includes(filterValue);
            case "damage":
                return String(threat.damage).includes(filterValue);
            case "risk":
                return String(threat.risk).includes(filterValue);
            case "status":
                return threat.status === value;
            default:
                return true;
        }
    });

const matchesGenericThreatFilters = (
    genericThreat: GenericThreatWithExtendedThreats,
    columnFilters: Record<string, string>,
    t: TFunction
): boolean =>
    Object.entries(columnFilters).every(([field, value]) => {
        const filterValue = value.trim().toLowerCase();
        if (!filterValue) {
            return true;
        }
        switch (field) {
            case "name":
                return genericThreat.name.toLowerCase().includes(filterValue);
            case "componentName":
                return formatComponentName(genericThreat, t).toLowerCase().includes(filterValue);
            case "pointOfAttack":
                return t(`pointsOfAttackList.${genericThreat.pointOfAttack}`).toLowerCase().includes(filterValue);
            case "attacker":
                return t(`attackerList.${genericThreat.attacker}`).toLowerCase().includes(filterValue);
            default:
                return true;
        }
    });

/**
 * Flattens the generic threats and their threats into the grid's rows. The grid's own filtering
 * would treat generic threat and threat rows independently and tear the hierarchy apart, so the
 * column filters are applied here while building the rows.
 */
export const buildThreatsRows = ({
    genericThreats,
    threatsByGenericThreatId,
    expandedGenericThreatIds,
    columnFilters,
    t,
}: {
    genericThreats: GenericThreatWithExtendedThreats[];
    threatsByGenericThreatId: Record<number, ExtendedThreatWithMetrics[]>;
    expandedGenericThreatIds: Record<number, boolean>;
    columnFilters: Record<string, string>;
    t: TFunction;
}): ThreatsGridRow[] => {
    const hasThreatOnlyFilter = threatOnlyFilterFields.some((field) => (columnFilters[field] ?? "").trim() !== "");

    const result: ThreatsGridRow[] = [];
    for (const genericThreat of genericThreats) {
        const threats = threatsByGenericThreatId[genericThreat.id] ?? [];
        const visibleThreats = threats.filter((threat) => matchesThreatFilters(threat, columnFilters, t));

        const genericThreatVisible =
            visibleThreats.length > 0 ||
            (!hasThreatOnlyFilter && matchesGenericThreatFilters(genericThreat, columnFilters, t));
        if (!genericThreatVisible) {
            continue;
        }

        const isExpanded = expandedGenericThreatIds[genericThreat.id] ?? false;
        result.push({
            rowType: "genericThreat",
            rowId: `${GENERIC_THREAT_ROW_PREFIX}${genericThreat.id}`,
            genericThreat,
            threatCount: visibleThreats.length,
            isExpanded,
        });
        if (isExpanded) {
            if (visibleThreats.length === 0) {
                result.push({ rowType: "noThreats", rowId: `empty-${genericThreat.id}` });
            } else {
                for (const threat of visibleThreats) {
                    result.push({
                        rowType: "threat",
                        rowId: `${THREAT_ROW_PREFIX}${threat.id}`,
                        threat,
                    });
                }
            }
        }
    }
    return result;
};
