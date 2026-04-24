import type { APIRequestContext } from "@playwright/test";
import type { Asset, CreateAssetRequest } from "#api/types/asset.types.ts";
import { fetchApi } from "../utils/api.utils.ts";

export async function getAssets(request: APIRequestContext, token: string, projectId: number): Promise<Asset[]> {
    return fetchApi(request, token, "GET", `/projects/${projectId}/assets`);
}

export async function createAsset(
    request: APIRequestContext,
    token: string,
    body: CreateAssetRequest
): Promise<Asset> {
    return fetchApi(request, token, "POST", `/projects/${body.projectId}/assets`, body);
}

export async function createAssets(
    request: APIRequestContext,
    token: string,
    bodies: CreateAssetRequest[]
): Promise<Asset[]> {
    const results: Asset[] = [];
    for (const body of bodies) {
        results.push(await createAsset(request, token, body));
    }
    return results;
}

