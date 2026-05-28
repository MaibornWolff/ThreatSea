import type { APIRequestContext } from "@playwright/test";
import type { CreateMeasureRequest, Measure } from "#api/types/measure.types.ts";
import { fetchApi } from "../utils/api.utils.ts";

export async function createMeasure(
    request: APIRequestContext,
    token: string,
    body: CreateMeasureRequest
): Promise<Measure> {
    const { projectId, ...rest } = body;
    return fetchApi(request, token, "POST", `/projects/${projectId}/system/measures`, rest);
}

export async function createMeasures(
    request: APIRequestContext,
    token: string,
    bodies: CreateMeasureRequest[]
): Promise<Measure[]> {
    const results: Measure[] = [];
    for (const body of bodies) {
        results.push(await createMeasure(request, token, body));
    }
    return results;
}
