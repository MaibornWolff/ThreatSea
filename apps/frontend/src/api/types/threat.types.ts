import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";

export interface Threat {
    id: number;
    pointOfAttackId: string;
    catalogThreatId: number;
    name: string;
    description: string;
    pointOfAttack: POINTS_OF_ATTACK;
    attacker: ATTACKERS;
    probability: number;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    doneEditing: boolean;
    projectId: number;
    createdAt: Date;
    updatedAt: Date;
}
