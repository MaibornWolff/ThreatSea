import type { APIRequestContext } from "@playwright/test";
import type { CatalogThreat, CreateCatalogThreatRequest } from "#api/types/catalog-threat.types.ts";
import type { CatalogMeasure, CreateCatalogMeasureRequest } from "#api/types/catalog-measure.types.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { ATTACKERS } from "#api/types/attackers.types.ts";
import { fetchApi } from "../utils/api.utils.ts";

export async function getCatalogThreats(
    request: APIRequestContext,
    token: string,
    catalogId: number
): Promise<CatalogThreat[]> {
    return fetchApi(request, token, "GET", `/catalogs/${catalogId}/threats`);
}

export async function createCatalogThreat(
    request: APIRequestContext,
    token: string,
    body: CreateCatalogThreatRequest
): Promise<CatalogThreat> {
    const { catalogId, ...rest } = body;
    return fetchApi(request, token, "POST", `/catalogs/${catalogId}/threats`, rest);
}

export async function createCatalogThreats(
    request: APIRequestContext,
    token: string,
    items: {
        name: string;
        description: string;
        pointsOfAttack: POINTS_OF_ATTACK[];
        attackers: ATTACKERS[];
        probability: number;
        confidentiality: boolean;
        integrity: boolean;
        availability: boolean;
        catalogId: number;
        createdAt: Date;
    }[]
): Promise<CatalogThreat[]> {
    const results: CatalogThreat[] = [];
    for (const item of items) {
        const { attackers, pointsOfAttack, ...base } = item;
        for (const attacker of attackers) {
            for (const pointOfAttack of pointsOfAttack) {
                results.push(await createCatalogThreat(request, token, { ...base, attacker, pointOfAttack }));
            }
        }
    }
    return results;
}

export async function deleteCatalogThreats(
    request: APIRequestContext,
    token: string,
    catalogId: number,
    threatIds: number[]
): Promise<void> {
    for (const id of threatIds) {
        await fetchApi(request, token, "DELETE", `/catalogs/${catalogId}/threats/${id}`);
    }
}

export async function getCatalogMeasures(
    request: APIRequestContext,
    token: string,
    catalogId: number
): Promise<CatalogMeasure[]> {
    return fetchApi(request, token, "GET", `/catalogs/${catalogId}/measures`);
}

export async function createCatalogMeasure(
    request: APIRequestContext,
    token: string,
    body: CreateCatalogMeasureRequest
): Promise<CatalogMeasure> {
    const { catalogId, ...rest } = body;
    return fetchApi(request, token, "POST", `/catalogs/${catalogId}/measures`, rest);
}

export async function createCatalogMeasures(
    request: APIRequestContext,
    token: string,
    items: {
        name: string;
        description: string;
        pointsOfAttack: POINTS_OF_ATTACK[];
        attackers: ATTACKERS[];
        probability: number;
        confidentiality: boolean;
        integrity: boolean;
        availability: boolean;
        catalogId: number;
        createdAt: Date;
    }[]
): Promise<CatalogMeasure[]> {
    const results: CatalogMeasure[] = [];
    for (const item of items) {
        const { attackers, pointsOfAttack, ...base } = item;
        for (const attacker of attackers) {
            for (const pointOfAttack of pointsOfAttack) {
                results.push(await createCatalogMeasure(request, token, { ...base, attacker, pointOfAttack }));
            }
        }
    }
    return results;
}

export async function deleteCatalogMeasures(
    request: APIRequestContext,
    token: string,
    catalogId: number,
    measureIds: number[]
): Promise<void> {
    for (const id of measureIds) {
        await fetchApi(request, token, "DELETE", `/catalogs/${catalogId}/measures/${id}`);
    }
}
