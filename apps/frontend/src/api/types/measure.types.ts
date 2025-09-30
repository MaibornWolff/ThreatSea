export interface CreateMeasureRequest {
    name: string;
    description: string;
    scheduledAt: Date;
    projectId: number;
    catalogMeasureId?: number;
}

export type UpdateMeasureRequest = Partial<Omit<CreateMeasureRequest, "catalogMeasureId">> & {
    id: number;
    projectId: number;
};

export interface Measure {
    id: number;
    name: string;
    description: string;
    scheduledAt: Date;
    projectId: number;
    catalogMeasureId: number | null;
    createdAt: Date;
    updatedAt: Date;
}
