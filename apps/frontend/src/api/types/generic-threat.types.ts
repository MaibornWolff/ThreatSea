import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { ExtendedChildThreat } from "#api/types/child-threat.types.ts";

export interface GenericThreat {
    id: number;
    projectId: number;
    catalogThreatId: number;
    pointOfAttackId: string;
    name: string;
    description: string;
    pointOfAttack: POINTS_OF_ATTACK;
    attacker: ATTACKERS;
    createdAt: string;
    updatedAt: string;
}

export interface GenericThreatWithExtendedChildren extends GenericThreat {
    children: ExtendedChildThreat[];
}
