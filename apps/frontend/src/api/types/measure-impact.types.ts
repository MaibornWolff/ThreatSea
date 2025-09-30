export interface CreateMeasureImpactRequest {
    measureId: number;
    threatId: number;
    description: string;
    setsOutOfScope: boolean;
    impactsProbability: boolean;
    impactsDamage: boolean;
    probability: number | null;
    damage: number | null;
    projectId: number;
}

export type UpdateMeasureImpactRequest = Partial<Omit<CreateMeasureImpactRequest, "measureId" | "threatId">> & {
    id: number;
    projectId: number;
};

export interface MeasureImpact {
    id: number;
    measureId: number;
    threatId: number;
    description: string;
    setsOutOfScope: boolean;
    impactsProbability: boolean;
    impactsDamage: boolean;
    probability: number | null;
    damage: number | null;
    projectId: number;
    createdAt: Date;
    updatedAt: Date;
}
