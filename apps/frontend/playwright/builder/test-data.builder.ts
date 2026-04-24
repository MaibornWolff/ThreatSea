import type { CONFIDENTIALITY_LEVELS } from "#utils/confidentiality.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { ATTACKERS } from "#api/types/attackers.types.ts";

/**
 * Builds a unique test identifier combining browser name and test ID.
 */
export function buildTestId(browserName: string, testId: string): string {
    return `${browserName}-${testId.slice(0, 16)}`;
}

/**
 * Builds a catalog creation payload.
 */
export function buildCatalog(name: string, language = "EN", defaultContent = true) {
    return { name, language, defaultContent };
}

/**
 * Builds a project creation payload.
 */
export function buildProject(
    name: string,
    catalogId: number,
    confidentialityLevel: CONFIDENTIALITY_LEVELS,
    description = "Sample project description"
) {
    return { name, description, confidentialityLevel, catalogId };
}

/**
 * Maps catalog threat/measure fixture data to creation-ready objects with a catalogId.
 */
export function buildCatalogContentItems<
    T extends {
        name: string;
        description: string;
        pointsOfAttack: string[];
        attackers: string[];
        probability: number;
        confidentiality: boolean;
        integrity: boolean;
        availability: boolean;
        createdAt: string;
    },
>(items: T[], catalogId: number) {
    return items.map((item) => ({
        ...item,
        catalogId,
        createdAt: new Date(item.createdAt),
        pointsOfAttack: item.pointsOfAttack as POINTS_OF_ATTACK[],
        attackers: item.attackers as ATTACKERS[],
    }));
}

