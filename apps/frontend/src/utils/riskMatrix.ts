import { calcRiskColour } from "#utils/calcRisk.ts";
import type { MatrixColorKey } from "#view/colors/matrix.ts";

export interface RiskMatrixCellBase {
    color: MatrixColorKey;
    amount?: number;
}

export const toDayNumber = (date: Date): number => Math.floor(date.getTime() / 1000 / 3600 / 24);

/**
 * Create empty 5x5 risk-matrix-"design" (only background)
 * according to given line of tolerance.
 */
export const createRiskMatrixDesign = <T extends RiskMatrixCellBase>(
    lineOfToleranceGreen: number,
    lineOfToleranceRed: number
): T[][] => {
    const matrix: T[][] = [];
    for (let y = 0; y < 5; y++) {
        const row: T[] = [];
        for (let x = 0; x < 5; x++) {
            row.push({
                color: calcRiskColour(x + 1, 5 - y, lineOfToleranceGreen, lineOfToleranceRed),
            } as T);
        }
        matrix.push(row);
    }
    return matrix;
};

/**
 * put threats in matching cells of an existing matrix.
 * `getCoords` defines, which probability/damage-pair is used per threat
 * (e.g. gross vs. net).
 */
export const addThreatsToRiskMatrix = <T extends RiskMatrixCellBase, Threat>(
    design: T[][],
    threats: Threat[],
    getCoords: (threat: Threat) => { probability: number; damage: number }
): T[][] => {
    return threats.reduce(
        (arr, threat) => {
            const { probability, damage } = getCoords(threat);
            const y = 5 - probability;
            const x = damage - 1;
            if (x >= 0 && y >= 0 && arr[y]?.[x]) {
                // if no protection goal is affected risk is not in the matrix
                if (typeof arr[y][x].amount !== "number") {
                    arr[y][x].amount = 0;
                }
                arr[y][x].amount!++;
            }
            return arr;
        },
        design.map((row) => row.map((cell) => ({ ...cell })))
    );
};
