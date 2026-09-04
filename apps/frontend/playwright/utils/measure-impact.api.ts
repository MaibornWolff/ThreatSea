import type { APIRequestContext } from "@playwright/test";
import type { CreateMeasureImpactRequest, MeasureImpact } from "#api/types/measure-impact.types.ts";
import { fetchApi } from "./api.utils.ts";

export async function createMeasureImpact(
    request: APIRequestContext,
    token: string,
    body: CreateMeasureImpactRequest
): Promise<MeasureImpact> {
    const { projectId, ...rest } = body;
    return fetchApi(request, token, "POST", `/projects/${projectId}/system/measureImpacts`, rest);
}
