import { calcNetRisk } from "./calcRisk";
import { createMeasureImpact } from "#test-utils/builders.ts";

describe("calcNetRisk", () => {
    it("returns the gross values unchanged when there are no measures", () => {
        expect(calcNetRisk(4, 5, [])).toEqual({ netProbability: 4, netDamage: 5, netRisk: 20 });
    });

    it("ignores null or undefined measure impacts", () => {
        expect(calcNetRisk(3, 3, [null, undefined])).toEqual({ netProbability: 3, netDamage: 3, netRisk: 9 });
    });

    it("lowers the probability when a measure impacts probability", () => {
        const measureImpact = createMeasureImpact({ impactsProbability: true, probability: 2 });

        expect(calcNetRisk(5, 4, [measureImpact])).toEqual({ netProbability: 2, netDamage: 4, netRisk: 8 });
    });

    it("lowers the damage when a measure impacts damage", () => {
        const measureImpact = createMeasureImpact({ impactsDamage: true, damage: 1 });

        expect(calcNetRisk(3, 5, [measureImpact])).toEqual({ netProbability: 3, netDamage: 1, netRisk: 3 });
    });

    it("never raises a value when the measure impact is higher than the gross value", () => {
        const measureImpact = createMeasureImpact({ impactsProbability: true, probability: 5 });

        expect(calcNetRisk(2, 4, [measureImpact]).netProbability).toBe(2);
    });

    it("drops probability and damage to zero when a measure sets the threat out of scope", () => {
        const measureImpact = createMeasureImpact({ setsOutOfScope: true });

        expect(calcNetRisk(5, 5, [measureImpact])).toEqual({ netProbability: 0, netDamage: 0, netRisk: 0 });
    });

    it("applies the most protective value across multiple measures", () => {
        const weaker = createMeasureImpact({ id: 1, impactsProbability: true, probability: 3 });
        const stronger = createMeasureImpact({ id: 2, impactsProbability: true, probability: 1 });

        expect(calcNetRisk(5, 4, [weaker, stronger]).netProbability).toBe(1);
    });

    it("leaves a value untouched when the measure impacts the goal but carries a null value", () => {
        const measureImpact = createMeasureImpact({ impactsProbability: true, probability: null });

        expect(calcNetRisk(4, 4, [measureImpact]).netProbability).toBe(4);
    });
});
