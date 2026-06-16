/**
 * @module risk - calculate risk values and colors
 */

import type { MatrixColorKey } from "#view/colors/matrix.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";

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

/**
 * Reduces the gross probability and damage by the given measure impacts and
 * returns the resulting net probability, net damage and net risk.
 *
 * @param probability gross probability of the threat
 * @param damage gross damage of the threat
 * @param measureImpacts measure impacts to apply (null/undefined entries are ignored)
 * @returns the net probability, net damage and net risk
 */
export function calcNetRisk(
    probability: number,
    damage: number,
    measureImpacts: (MeasureImpact | null | undefined)[]
): { netProbability: number; netDamage: number; netRisk: number } {
    const [netProbability, netDamage] = measureImpacts.reduce<[number, number]>(
        ([currentProbability, currentDamage], measureImpact) => {
            if (measureImpact == null) {
                return [currentProbability, currentDamage];
            }

            let impactedProbability = measureImpact.impactsProbability ? measureImpact.probability : currentProbability;
            let impactedDamage = measureImpact.impactsDamage ? measureImpact.damage : currentDamage;

            impactedProbability = measureImpact.setsOutOfScope ? 0 : impactedProbability;
            impactedDamage = measureImpact.setsOutOfScope ? 0 : impactedDamage;

            return [
                impactedProbability != null && currentProbability > impactedProbability
                    ? impactedProbability
                    : currentProbability,
                impactedDamage != null && currentDamage > impactedDamage ? impactedDamage : currentDamage,
            ];
        },
        [probability, damage]
    );

    return { netProbability, netDamage, netRisk: netProbability * netDamage };
}
