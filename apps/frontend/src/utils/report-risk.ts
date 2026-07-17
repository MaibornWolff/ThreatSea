import type { ProjectReport } from "#api/types/project.types.ts";
import type { MatrixColorKey } from "#view/colors/matrix.ts";
import { calcNetRisk } from "#utils/calcRisk.ts";
import { dayNumberFromDateString, addThreatsToRiskMatrix } from "#utils/riskMatrix.ts";

export type ReportThreat = ProjectReport["threats"][number];
export type ReportMeasure = ProjectReport["measures"][number];

export interface RiskMatrixCell {
    color: MatrixColorKey;
    amount?: number;
}
export type RiskMatrix = RiskMatrixCell[][];

export interface RiskBarGraph {
    green: number;
    yellow: number;
    red: number;
}

export interface Milestone {
    scheduledAt: string;
    matrix: RiskMatrix | null;
    barGraph: RiskBarGraph | null;
    measures?: ReportMeasure[];
    active?: boolean;
}

/**
 * True when the measure is scheduled inside the [fromDay, tillDay] range (day numbers, inclusive).
 * A missing or unparseable scheduledAt is treated as out of range. A null bound means "unbounded".
 */
const isMeasureWithinScheduledRange = (
    measure: { scheduledAt?: string | null | undefined },
    fromDay: number | null,
    tillDay: number | null
): boolean => {
    const scheduledAtDay = measure.scheduledAt ? dayNumberFromDateString(measure.scheduledAt) : NaN;
    if (Number.isNaN(scheduledAtDay)) {
        return false;
    }
    if (fromDay !== null && fromDay > scheduledAtDay) {
        return false;
    }
    if (tillDay !== null && tillDay < scheduledAtDay) {
        return false;
    }
    return true;
};

/**
 * Keeps only the measures scheduled inside the range on each threat and recomputes the threat's
 * net probability/damage/risk from the surviving measures, so the report reflects exactly the
 * measures shown for the selected period. Returns the threats unchanged when no range is set.
 */
export const filterThreatsByScheduledRange = (
    threats: ReportThreat[],
    fromScheduledAt: string | null,
    tillScheduledAt: string | null
): ReportThreat[] => {
    if (!fromScheduledAt && !tillScheduledAt) {
        return threats;
    }
    const fromDay = fromScheduledAt ? dayNumberFromDateString(fromScheduledAt) : null;
    const tillDay = tillScheduledAt ? dayNumberFromDateString(tillScheduledAt) : null;
    return threats.map((threat) => {
        const filteredMeasures = threat.measures.filter((measure) =>
            isMeasureWithinScheduledRange(measure, fromDay, tillDay)
        );
        const { netProbability, netDamage, netRisk } = calcNetRisk(threat.probability, threat.damage, filteredMeasures);
        return {
            ...threat,
            measures: filteredMeasures,
            netProbability,
            netDamage,
            netRisk,
        };
    });
};

/**
 * Keeps only the measures scheduled inside the range. Returns the measures unchanged when no
 * range is set.
 */
export const filterMeasuresByScheduledRange = (
    measures: ReportMeasure[],
    fromScheduledAt: string | null,
    tillScheduledAt: string | null
): ReportMeasure[] => {
    if (!fromScheduledAt && !tillScheduledAt) {
        return measures;
    }
    const fromDay = fromScheduledAt ? dayNumberFromDateString(fromScheduledAt) : null;
    const tillDay = tillScheduledAt ? dayNumberFromDateString(tillScheduledAt) : null;
    return measures.filter((measure) => isMeasureWithinScheduledRange(measure, fromDay, tillDay));
};

/**
 * Net risk of a threat when only the measures scheduled on or before the given date are applied.
 */
export const calcActiveMeasureNetRisk = (threat: ReportThreat, scheduledAt: string) => {
    const activeMeasures = threat.measures.filter((measure) => {
        if (!measure.scheduledAt) {
            return false;
        }
        const measureScheduledAt = dayNumberFromDateString(measure.scheduledAt);
        return !Number.isNaN(measureScheduledAt) && measureScheduledAt <= dayNumberFromDateString(scheduledAt);
    });
    return calcNetRisk(threat.probability, threat.damage, activeMeasures);
};

export const calcNetRiskMatrix = (
    threats: ReportThreat[] | null | undefined,
    matrix: RiskMatrix | null,
    scheduledAt: string
): RiskMatrix | null => {
    if (!threats || !matrix) {
        return null;
    }
    return addThreatsToRiskMatrix(matrix, threats, (threat) => {
        const { netProbability, netDamage } = calcActiveMeasureNetRisk(threat, scheduledAt);
        return { probability: netProbability, damage: netDamage };
    });
};

export const calcRiskBarGraph = (matrix: RiskMatrix | null): RiskBarGraph | null => {
    if (!matrix) {
        return null;
    }
    return matrix.reduce(
        (summary, row) => {
            row.forEach((cell) => {
                const { color, amount } = cell;
                if (typeof amount === "number" && (color === "green" || color === "yellow" || color === "red")) {
                    summary[color] += amount;
                }
            });
            return summary;
        },
        { green: 0, yellow: 0, red: 0 } as RiskBarGraph
    );
};
