import type { USER_ROLES } from "#api/types/user-roles.types.ts";

export interface CreateCatalogRequest {
    name: string;
    language: string;
    defaultContent: boolean;
}

export type UpdateCatalogRequest = Partial<Omit<CreateCatalogRequest, "language">> & { id: number };

export interface Catalog {
    id: number;
    name: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CatalogWithRole = Catalog & { role: USER_ROLES };
