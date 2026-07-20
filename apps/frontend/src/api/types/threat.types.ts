import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { Asset } from "#api/types/asset.types.ts";
import type { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";

export interface Threat {
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
    status: THREAT_STATUSES;
    createdAt: string;
    updatedAt: string;
}

export interface ExtendedThreat extends Threat {
    genericThreatDescription: string;
    componentName: string | null;
    componentType: number | null;
    interfaceName: string | null;
    assets: Asset[];
}

// The user-editable subset of a child threat; identity fields are derived from the
// parent generic threat on the backend and cannot be set by the client.
export interface ThreatRefinement {
    name?: string;
    description?: string;
    probability?: number;
    confidentiality?: boolean;
    integrity?: boolean;
    availability?: boolean;
    status?: THREAT_STATUSES;
}

export type CreateThreatRequest = ThreatRefinement & { projectId: number; genericThreatId: number };

export type UpdateThreatRequest = ThreatRefinement & { id: number; projectId: number };
