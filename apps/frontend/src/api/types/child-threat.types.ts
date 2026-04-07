import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";

export interface ChildThreat {
    id: number;
    projectId: number;
    genericThreatId: number;
    pointOfAttackId: string;
    name: string;
    description: string;
    pointOfAttack: POINTS_OF_ATTACK;
    attacker: ATTACKERS;
    probability: number;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    doneEditing: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ExtendedChildThreat extends ChildThreat {
    componentName: string | null;
    componentType: number | null;
    interfaceName: string | null;
    assets: { id: number; name: string }[];
}
