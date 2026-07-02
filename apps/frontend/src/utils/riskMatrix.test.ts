import { describe, it, expect, vi } from "vitest";
import { type RiskMatrixCellBase, createRiskMatrixDesign, addThreatsToRiskMatrix } from "#utils/riskMatrix.ts";
import * as calcRiskModule from "#utils/calcRisk.ts";

describe("createRiskMatrixDesign", () => {
    it("creates a 5x5 Matrix", () => {
        const matrix = createRiskMatrixDesign(6, 15);
        expect(matrix).toHaveLength(5);
        matrix.forEach((row) => expect(row).toHaveLength(5));
    });

    it("calls calcRiskColour with correct coordinates (x+1, 5-y)", () => {
        const spy = vi.spyOn(calcRiskModule, "calcRiskColour");
        createRiskMatrixDesign(6, 15);

        // first row (y=0) => probability = 5
        expect(spy).toHaveBeenCalledWith(1, 5, 6, 15); // x=0,y=0 -> damage=1, probability=5
        // last row (y=4) => probability = 1
        expect(spy).toHaveBeenCalledWith(5, 1, 6, 15); // x=4,y=4 -> damage=5, probability=1

        spy.mockRestore();
    });

    it("returns only colour for each cell, no amount", () => {
        const matrix = createRiskMatrixDesign(6, 15);
        matrix.flat().forEach((cell) => {
            expect(cell).toHaveProperty("color");
            expect(cell.amount).toBeUndefined();
        });
    });

    it("creates different colour distribution with different tolerance thresholds", () => {
        const strict = createRiskMatrixDesign(2, 4);
        const lenient = createRiskMatrixDesign(20, 25);

        const strictReds = strict.flat().filter((c) => c.color === "red").length;
        const lenientReds = lenient.flat().filter((c) => c.color === "red").length;

        expect(strictReds).toBeGreaterThan(lenientReds);
    });
});

describe("addThreatsToRiskMatrix", () => {
    const emptyDesign = (): RiskMatrixCellBase[][] =>
        Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ({ color: "green" as const })));

    it("puts a threat in the correct cell", () => {
        const design = emptyDesign();
        const threats = [{ probability: 5, damage: 1 }]; // -> y=0, x=0

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        expect(result[0]?.[0]?.amount).toBe(1);
    });

    it("increases amount with different threats in the same cell", () => {
        const design = emptyDesign();
        const threats = [
            { probability: 3, damage: 3 },
            { probability: 3, damage: 3 },
            { probability: 3, damage: 3 },
        ];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        // probability=3 -> y=2, damage=3 -> x=2
        expect(result[2]?.[2]?.amount).toBe(3);
    });

    it("ignores threats outside the matrix (probability or damage <= 0)", () => {
        const design = emptyDesign();
        const threats = [{ probability: 0, damage: 3 }];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        // no amount for the cell
        result.flat().forEach((cell) => expect(cell.amount).toBeUndefined());
    });

    it("ignores threats outside the matrix (probability > 5 or damage > 5)", () => {
        const design = emptyDesign();
        const threats = [{ probability: 6, damage: 3 }];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        result.flat().forEach((cell) => expect(cell.amount).toBeUndefined());
    });

    it("doesn't change the original design (Immutability)", () => {
        const design = emptyDesign();
        const originalSnapshot = JSON.parse(JSON.stringify(design));
        const threats = [{ probability: 5, damage: 1 }];

        addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        expect(design).toEqual(originalSnapshot);
    });

    it("works with empty threat list and leaves the matrix unchanged (only copy)", () => {
        const design = emptyDesign();

        const result = addThreatsToRiskMatrix(design, [], () => ({ probability: 1, damage: 1 }));

        expect(result).toEqual(design);
        expect(result).not.toBe(design); // es ist eine Kopie
    });

    it("uses the getCoords-Accessor correctly (e.g. for netProbability/netDamage)", () => {
        const design = emptyDesign();
        const threats = [{ probability: 1, damage: 1, netProbability: 5, netDamage: 5 }];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.netProbability,
            damage: t.netDamage,
        }));

        // netProbability=5 -> y=0, netDamage=5 -> x=4
        expect(result[0]?.[4]?.amount).toBe(1);
        // the "normal" probability/damage-cell remains untouched
        expect(result[4]?.[0]?.amount).toBeUndefined();
    });

    it("keeps existing amount-values in the design and increases them", () => {
        const design = emptyDesign();
        design[0]![0]!.amount = 5; // preallocated

        const threats = [{ probability: 5, damage: 1 }];
        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        expect(result[0]?.[0]?.amount).toBe(6);
    });
});
