import type { ATTACKERS } from "#api/types/attackers.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";

export interface CreateCatalogMeasureRequest {
    attacker: ATTACKERS;
    name: string;
    description: string;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    pointOfAttack: POINTS_OF_ATTACK;
    probability?: number | null;
    catalogId: number;
}

export type UpdateCatalogMeasureRequest = Partial<CreateCatalogMeasureRequest> & { id: number; catalogId: number };

export interface CatalogMeasure {
    id: number;
    attacker: ATTACKERS;
    name: string;
    description: string;
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
    pointOfAttack: POINTS_OF_ATTACK;
    probability: number | null;
    catalogId: number;
    createdAt: Date;
    updatedAt: Date;
}
