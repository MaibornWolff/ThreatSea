import {
    createRiskMatrixDesign,
    addThreatsToRiskMatrix,
    dayNumberFromDateString,
    type RiskMatrixCellBase,
} from "#utils/riskMatrix.ts";
import { calcRiskColour } from "#utils/calcRisk.ts";

describe("createRiskMatrixDesign", () => {
    it("creates a 5x5 matrix", () => {
        const matrix = createRiskMatrixDesign(6, 15);
        expect(matrix).toHaveLength(5);
        matrix.forEach((row) => expect(row).toHaveLength(5));
    });

    it("maps each cell position to the correct risk coordinates (damage=x+1, probability=5-y)", () => {
        const green = 6,
            red = 15;
        const matrix = createRiskMatrixDesign(green, red);

        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                expect(matrix[y]![x]!.color).toBe(calcRiskColour(x + 1, 5 - y, green, red));
            }
        }
    });

    it("returns only the color for each cell, no amount", () => {
        const matrix = createRiskMatrixDesign(6, 15);
        matrix.flat().forEach((cell) => {
            expect(cell).toHaveProperty("color");
            expect(cell.amount).toBeUndefined();
        });
    });

    it("produces different color distributions for different tolerance values", () => {
        const strict = createRiskMatrixDesign(2, 4);
        const lenient = createRiskMatrixDesign(20, 25);

        const strictReds = strict.flat().filter((c) => c.color === "red").length;
        const lenientReds = lenient.flat().filter((c) => c.color === "red").length;

        expect(strictReds).toBeGreaterThan(lenientReds);
    });

    it("does not throw when green === red (degenerate configuration)", () => {
        expect(() => createRiskMatrixDesign(10, 10)).not.toThrow();
        const matrix = createRiskMatrixDesign(10, 10);
        expect(matrix.flat()).toHaveLength(25);
    });

    it("does not throw when green > red (inverted/invalid configuration)", () => {
        expect(() => createRiskMatrixDesign(15, 6)).not.toThrow();
    });

    it("does not throw for zero or negative tolerance values", () => {
        expect(() => createRiskMatrixDesign(0, 0)).not.toThrow();
        expect(() => createRiskMatrixDesign(-5, -1)).not.toThrow();
    });
});

describe("addThreatsToRiskMatrix", () => {
    const emptyDesign = (): RiskMatrixCellBase[][] =>
        Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ({ color: "green" as const })));

    it("counts a single threat into the correct cell", () => {
        const design = emptyDesign();
        const threats = [{ probability: 5, damage: 1 }]; // -> y=0, x=0

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        expect(result[0]?.[0]?.amount).toBe(1);
    });

    it("increments amount for multiple threats in the same cell", () => {
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

    it("distributes multiple threats correctly across different cells", () => {
        const design = emptyDesign();
        const threats = [
            { probability: 5, damage: 1 }, // y=0, x=0
            { probability: 1, damage: 5 }, // y=4, x=4
            { probability: 3, damage: 3 }, // y=2, x=2
        ];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        expect(result[0]?.[0]?.amount).toBe(1);
        expect(result[4]?.[4]?.amount).toBe(1);
        expect(result[2]?.[2]?.amount).toBe(1);

        const touchedCells = [result[0]![0], result[4]![4], result[2]![2]];
        result.flat().forEach((cell) => {
            if (!touchedCells.includes(cell)) {
                expect(cell.amount).toBeUndefined();
            }
        });
    });

    it("ignores threats outside the matrix (probability or damage <= 0)", () => {
        const design = emptyDesign();
        const threats = [{ probability: 0, damage: 3 }];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        result.flat().forEach((cell) => expect(cell.amount).toBeUndefined());
    });

    it("ignores threats outside the matrix (probability > 5)", () => {
        const design = emptyDesign();
        const threats = [{ probability: 6, damage: 3 }];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        result.flat().forEach((cell) => expect(cell.amount).toBeUndefined());
    });

    it("ignores threats with damage = 0", () => {
        const design = emptyDesign();
        const threats = [{ probability: 3, damage: 0 }];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        result.flat().forEach((cell) => expect(cell.amount).toBeUndefined());
    });

    it("ignores threats with damage = 6", () => {
        const design = emptyDesign();
        const threats = [{ probability: 3, damage: 6 }];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        result.flat().forEach((cell) => expect(cell.amount).toBeUndefined());
    });

    it("ignores threats with strongly negative or very large values", () => {
        const design = emptyDesign();
        const threats = [
            { probability: -100, damage: 3 },
            { probability: 3, damage: 9999 },
        ];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        result.flat().forEach((cell) => expect(cell.amount).toBeUndefined());
    });

    it("does not mutate the original design (immutability)", () => {
        const design = emptyDesign();
        const originalSnapshot = JSON.parse(JSON.stringify(design));
        const threats = [{ probability: 5, damage: 1 }];

        addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        expect(design).toEqual(originalSnapshot);
    });

    it("preserves the color property of every cell", () => {
        const design = emptyDesign();
        design[1]![1]!.color = "red";
        const threats = [{ probability: 4, damage: 2 }]; // y=1, x=1

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        expect(result[1]?.[1]?.color).toBe("red");
        expect(result[1]?.[1]?.amount).toBe(1);
    });

    it("works with an empty threat list and leaves the matrix unchanged (except for the copy)", () => {
        const design = emptyDesign();

        const result = addThreatsToRiskMatrix(design, [], () => ({ probability: 1, damage: 1 }));

        expect(result).toEqual(design);
        expect(result).not.toBe(design); // it is a copy
    });

    it("uses the getCoords accessor correctly (e.g. for netProbability/netDamage)", () => {
        const design = emptyDesign();
        const threats = [{ probability: 1, damage: 1, netProbability: 5, netDamage: 5 }];

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.netProbability,
            damage: t.netDamage,
        }));

        // netProbability=5 -> y=0, netDamage=5 -> x=4
        expect(result[0]?.[4]?.amount).toBe(1);
        // the "regular" probability/damage cell remains untouched
        expect(result[4]?.[0]?.amount).toBeUndefined();
    });

    it("keeps existing amount values in the design and increments them further", () => {
        const design = emptyDesign();
        design[0]![0]!.amount = 5; // pre-set

        const threats = [{ probability: 5, damage: 1 }];
        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));

        expect(result[0]?.[0]?.amount).toBe(6);
    });

    it("does not throw for an undersized/incomplete design", () => {
        const smallDesign: RiskMatrixCellBase[][] = [[{ color: "green" }]]; // only 1x1
        const threats = [{ probability: 5, damage: 5 }];

        expect(() =>
            addThreatsToRiskMatrix(smallDesign, threats, (t) => ({
                probability: t.probability,
                damage: t.damage,
            }))
        ).not.toThrow();
    });

    it("handles non-integer coordinates safely (no crash, no incorrect assignment)", () => {
        const design = emptyDesign();
        const threats = [{ probability: 2.5, damage: 3 }];

        expect(() =>
            addThreatsToRiskMatrix(design, threats, (t) => ({
                probability: t.probability,
                damage: t.damage,
            }))
        ).not.toThrow();

        const result = addThreatsToRiskMatrix(design, threats, (t) => ({
            probability: t.probability,
            damage: t.damage,
        }));
        result.flat().forEach((cell) => expect(cell.amount).toBeUndefined());
    });
});

describe("dayNumberFromDateString", () => {
    it("maps known dates to their exact UTC day-number", () => {
        expect(dayNumberFromDateString("1970-01-01")).toBe(0);
        expect(dayNumberFromDateString("1970-01-11")).toBe(10);
        expect(dayNumberFromDateString("2026-03-15")).toBe(Math.floor(Date.UTC(2026, 2, 15) / 86_400_000));
    });

    it("increments by exactly 1 for consecutive days", () => {
        expect(dayNumberFromDateString("2026-03-16") - dayNumberFromDateString("2026-03-15")).toBe(1);
    });

    it("orders dates chronologically", () => {
        expect(dayNumberFromDateString("2025-12-31")).toBeLessThan(dayNumberFromDateString("2026-01-01"));
    });
});
