import {
    calcActiveMeasureNetRisk,
    calcRiskBarGraph,
    filterMeasuresByScheduledRange,
    filterThreatsByScheduledRange,
    type RiskMatrix,
} from "#application/hooks/report.utils.ts";
import { createReportMeasure, createReportThreat, createReportThreatMeasure } from "#test-utils/builders.ts";

describe("filterThreatsByScheduledRange", () => {
    it("returns the threats unchanged when no range is set", () => {
        const threats = [createReportThreat()];
        expect(filterThreatsByScheduledRange(threats, null, null)).toBe(threats);
    });

    it("keeps only the measures scheduled inside the range", () => {
        const january = createReportThreatMeasure({ scheduledAt: "2025-01-15T00:00:00.000Z" });
        const june = createReportThreatMeasure({ scheduledAt: "2025-06-15T00:00:00.000Z" });
        const threat = createReportThreat({ measures: [january, june] });

        const filtered = filterThreatsByScheduledRange([threat], "2025-01-01", "2025-01-31")[0]!;

        expect(filtered.measures).toHaveLength(1);
        expect(filtered.measures[0]!.scheduledAt).toBe("2025-01-15T00:00:00.000Z");
    });

    it("recomputes the net values from the surviving measures only (issue #877)", () => {
        // Gross 4 x 5 = 20. January measure lowers probability to 2, June measure lowers damage to 3.
        const january = createReportThreatMeasure({
            scheduledAt: "2025-01-15T00:00:00.000Z",
            impactsProbability: true,
            probability: 2,
        });
        const june = createReportThreatMeasure({
            scheduledAt: "2025-06-15T00:00:00.000Z",
            impactsDamage: true,
            damage: 3,
        });
        const threat = createReportThreat({
            probability: 4,
            damage: 5,
            measures: [january, june],
            // stale full-set net that must NOT leak through once June is filtered out
            netProbability: 2,
            netDamage: 3,
            netRisk: 6,
        });

        const filtered = filterThreatsByScheduledRange([threat], "2025-01-01", "2025-01-31")[0]!;

        expect(filtered.netProbability).toBe(2);
        expect(filtered.netDamage).toBe(5);
        expect(filtered.netRisk).toBe(10);
    });

    it("restores the gross net values when the range excludes every measure", () => {
        const measure = createReportThreatMeasure({
            scheduledAt: "2025-06-15T00:00:00.000Z",
            impactsProbability: true,
            probability: 1,
        });
        const threat = createReportThreat({
            probability: 4,
            damage: 5,
            measures: [measure],
            netProbability: 1,
            netDamage: 5,
            netRisk: 5,
        });

        const filtered = filterThreatsByScheduledRange([threat], "2025-01-01", "2025-01-31")[0]!;

        expect(filtered.measures).toHaveLength(0);
        expect(filtered.netProbability).toBe(4);
        expect(filtered.netDamage).toBe(5);
        expect(filtered.netRisk).toBe(20);
    });

    it("excludes measures without a scheduledAt", () => {
        const dated = createReportThreatMeasure({ scheduledAt: "2025-01-15T00:00:00.000Z" });
        const undatedMeasure = createReportThreatMeasure({ scheduledAt: undefined });
        const threat = createReportThreat({ measures: [dated, undatedMeasure] });

        const filtered = filterThreatsByScheduledRange([threat], "2025-01-01", null)[0]!;

        expect(filtered.measures).toHaveLength(1);
        expect(filtered.measures[0]).toBe(dated);
    });

    it("treats both range bounds as inclusive", () => {
        const onFrom = createReportThreatMeasure({ scheduledAt: "2025-01-01T00:00:00.000Z" });
        const onTill = createReportThreatMeasure({ scheduledAt: "2025-01-31T00:00:00.000Z" });
        const threat = createReportThreat({ measures: [onFrom, onTill] });

        const filtered = filterThreatsByScheduledRange([threat], "2025-01-01", "2025-01-31")[0]!;

        expect(filtered.measures).toHaveLength(2);
    });
});

describe("filterMeasuresByScheduledRange", () => {
    it("returns the measures unchanged when no range is set", () => {
        const measures = [createReportMeasure()];
        expect(filterMeasuresByScheduledRange(measures, null, null)).toBe(measures);
    });

    it("keeps only the measures scheduled inside the range", () => {
        const january = createReportMeasure({ id: 1, scheduledAt: new Date("2025-01-15") });
        const june = createReportMeasure({ id: 2, scheduledAt: new Date("2025-06-15") });

        const filtered = filterMeasuresByScheduledRange([january, june], "2025-01-01", "2025-01-31");

        expect(filtered).toHaveLength(1);
        expect(filtered[0]!.id).toBe(1);
    });

    it("applies only the lower bound when the upper bound is absent", () => {
        const january = createReportMeasure({ id: 1, scheduledAt: new Date("2025-01-15") });
        const june = createReportMeasure({ id: 2, scheduledAt: new Date("2025-06-15") });

        const filtered = filterMeasuresByScheduledRange([january, june], "2025-03-01", null);

        expect(filtered.map((measure) => measure.id)).toEqual([2]);
    });
});

describe("calcActiveMeasureNetRisk", () => {
    it("applies only the measures scheduled on or before the given date", () => {
        const early = createReportThreatMeasure({
            scheduledAt: "2025-01-15T00:00:00.000Z",
            impactsProbability: true,
            probability: 2,
        });
        const late = createReportThreatMeasure({
            scheduledAt: "2025-06-15T00:00:00.000Z",
            impactsDamage: true,
            damage: 1,
        });
        const threat = createReportThreat({ probability: 4, damage: 5, measures: [early, late] });

        const { netProbability, netDamage, netRisk } = calcActiveMeasureNetRisk(threat, new Date("2025-03-01"));

        expect(netProbability).toBe(2);
        expect(netDamage).toBe(5);
        expect(netRisk).toBe(10);
    });
});

describe("calcRiskBarGraph", () => {
    it("returns null for a null matrix", () => {
        expect(calcRiskBarGraph(null)).toBeNull();
    });

    it("sums the cell amounts per traffic-light colour", () => {
        const matrix: RiskMatrix = [
            [
                { color: "green", amount: 2 },
                { color: "red", amount: 1 },
            ],
            [
                { color: "yellow", amount: 3 },
                { color: "grey", amount: 5 },
            ],
        ];

        expect(calcRiskBarGraph(matrix)).toEqual({ green: 2, yellow: 3, red: 1 });
    });
});
