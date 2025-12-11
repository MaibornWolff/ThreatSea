/**
 * @module risk - calculate risk values and colors
 */

import type { MatrixColorKey } from "#view/colors/matrix.ts";

/**
 * returns the correct color for a risk
 *
 * @param riskValue
 * @param linoOfToleranceGreen
 * @param lineOfToleranceRed
 * @returns the color for the given risk
 */

export function calcRiskColourFromRisk(
    riskValue: number,
    lineOfToleranceGreen: number,
    lineOfToleranceRed: number
): MatrixColorKey {
    if (riskValue === 0) {
        return "grey";
    }
    if (lineOfToleranceGreen >= riskValue) {
        return "green";
    } else if (lineOfToleranceRed <= riskValue) {
        return "red";
    } else {
        return "yellow";
    }
}

/**
 * returns the correct color for a risk
 *
 * @param damage
 * @param probability
 * @param linoOfToleranceGreen
 * @param lineOfToleranceRed
 * @returns the color for the given risk by damage and probability
 */

export function calcRiskColour(
    damage: number,
    probability: number,
    lineOfToleranceGreen: number,
    lineOfToleranceRed: number
): MatrixColorKey {
    //out of scope handling
    if (damage === 0) {
        return "grey";
    }
    return calcRiskColourFromRisk(damage * probability, lineOfToleranceGreen, lineOfToleranceRed);
}
