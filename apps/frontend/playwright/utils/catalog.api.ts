import type { APIRequestContext } from "@playwright/test";
import type { Catalog, CatalogWithRole, CreateCatalogRequest } from "#api/types/catalogs.types.ts";
import { fetchApi } from "../utils/api.utils.ts";

export async function getCatalogs(request: APIRequestContext, token: string): Promise<CatalogWithRole[]> {
    return fetchApi(request, token, "GET", "/catalogs");
}

export async function createCatalog(
    request: APIRequestContext,
    token: string,
    body: CreateCatalogRequest
): Promise<Catalog> {
    return fetchApi(request, token, "POST", "/catalogs", body);
}

export async function createCatalogs(
    request: APIRequestContext,
    token: string,
    bodies: CreateCatalogRequest[]
): Promise<Catalog[]> {
    const results: Catalog[] = [];
    for (const body of bodies) {
        results.push(await createCatalog(request, token, body));
    }
    return results;
}

export async function deleteCatalog(request: APIRequestContext, token: string, catalogId: number): Promise<void> {
    await fetchApi(request, token, "DELETE", `/catalogs/${catalogId}`);
}

export async function deleteCatalogs(request: APIRequestContext, token: string, catalogIds: number[]): Promise<void> {
    for (const id of catalogIds) {
        await deleteCatalog(request, token, id);
    }
}
