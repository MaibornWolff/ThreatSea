import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";

export interface CreateCatalogThreatRequest {
    name: string;
    description: string;
    attacker: ATTACKERS;
    pointOfAttack: POINTS_OF_ATTACK;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    probability?: number | null;
    catalogId: number;
}

export type UpdateCatalogThreatRequest = Partial<CreateCatalogThreatRequest> & { id: number; catalogId: number };

export interface CatalogThreat {
    id: number;
    name: string;
    description: string;
    attacker: ATTACKERS;
    pointOfAttack: POINTS_OF_ATTACK;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    probability: number | null;
    catalogId: number;
    createdAt: Date;
    updatedAt: Date;
}
