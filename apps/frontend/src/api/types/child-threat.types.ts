import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { Asset } from "#api/types/asset.types.ts";
import type { CHILD_THREAT_STATUSES } from "#api/types/child-threat-statuses.types.ts";

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
    status: CHILD_THREAT_STATUSES;
    createdAt: string;
    updatedAt: string;
}

export interface ExtendedChildThreat extends ChildThreat {
    componentName: string | null;
    componentType: number | null;
    interfaceName: string | null;
    assets: Asset[];
}

// The user-editable subset of a child threat; identity fields are derived from the
// parent generic threat on the backend and cannot be set by the client.
export interface ChildThreatRefinement {
    name?: string;
    description?: string;
    probability?: number;
    confidentiality?: boolean;
    integrity?: boolean;
    availability?: boolean;
    status?: CHILD_THREAT_STATUSES;
}

export type CreateChildThreatRequest = ChildThreatRefinement & { projectId: number; genericThreatId: number };

export type UpdateChildThreatRequest = ChildThreatRefinement & { id: number; projectId: number };
