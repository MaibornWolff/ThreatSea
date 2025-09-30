export interface CreateAssetRequest {
    name: string;
    description: string;
    confidentiality: number;
    integrity: number;
    availability: number;
    confidentialityJustification: string;
    integrityJustification: string;
    availabilityJustification: string;
    projectId: number;
}

export type UpdateAssetRequest = Partial<CreateAssetRequest> & { id: number; projectId: number };

export interface Asset {
    id: number;
    name: string;
    description: string;
    confidentiality: number;
    integrity: number;
    availability: number;
    confidentialityJustification: string;
    integrityJustification: string;
    availabilityJustification: string;
    projectId: number;
    createdAt: Date;
    updatedAt: Date;
}
