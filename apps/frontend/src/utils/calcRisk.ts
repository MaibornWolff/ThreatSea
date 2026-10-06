/**
 * @module risk - calculate risk values and colors
 */

import type { MatrixColorKey } from "#view/colors/matrix.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";

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

/**
 * Net risk of a threat, honouring its status: a threat put out of scope carries no residual
 * risk, no matter which measures are applied to it. The gross values are not affected.
 *
 * @param threat the threat with its status and gross probability/damage
 * @param measureImpacts measure impacts to apply (null/undefined entries are ignored)
 * @returns the net probability, net damage and net risk
 */
export function calcThreatNetRisk(
    threat: { status: THREAT_STATUSES; probability: number; damage: number },
    measureImpacts: (MeasureImpact | null | undefined)[]
): { netProbability: number; netDamage: number; netRisk: number } {
    if (threat.status === THREAT_STATUSES.OUTOFSCOPE) {
        return { netProbability: 0, netDamage: 0, netRisk: 0 };
    }

    return calcNetRisk(threat.probability, threat.damage, measureImpacts);
}
