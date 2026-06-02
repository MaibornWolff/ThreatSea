import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { StandardIcon } from "#api/types/standard-component.types.ts";

export interface CreateComponentTypeRequest {
    name: string;
    pointsOfAttack: POINTS_OF_ATTACK[];
    symbol: string | null;
    standardIcon: StandardIcon | null;
    projectId: number;
}

export type UpdateComponentTypeRequest = Partial<CreateComponentTypeRequest> & { id: number; projectId: number };

export interface ComponentType {
    id: number;
    name: string;
    pointsOfAttack: POINTS_OF_ATTACK[];
    symbol: string | null;
    standardIcon: StandardIcon | null;
    projectId: number;
    createdAt: Date;
    updatedAt: Date;
}
