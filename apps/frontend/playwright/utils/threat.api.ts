import type { APIRequestContext } from "@playwright/test";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { fetchApi } from "./api.utils.ts";

export async function getThreats(
    request: APIRequestContext,
    token: string,
    projectId: number
): Promise<ExtendedThreat[]> {
    return fetchApi(request, token, "GET", `/projects/${projectId}/system/threats`);
}
