import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import type { Asset } from "#api/types/asset.types.ts";

export interface CreateThreatRequest {
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
}

export type UpdateThreatRequest = Partial<
    Omit<CreateThreatRequest, "pointOfAttackId" | "pointOfAttack" | "attacker" | "catalogThreatId">
> & { id: number; projectId: number };

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

export interface ExtendedThreat extends Threat {
    componentName: string | null;
    componentType: number | STANDARD_COMPONENT_TYPES | null;
    interfaceName: string | null;
    assets: Asset[];
}
