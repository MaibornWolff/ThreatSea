import type { APIRequestContext } from "@playwright/test";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";
import type { CreateThreatRequest, ExtendedThreat, Threat } from "#api/types/threat.types.ts";
import { fetchApi } from "./api.utils.ts";

export async function getThreats(
    request: APIRequestContext,
    token: string,
    projectId: number
): Promise<ExtendedThreat[]> {
    const genericThreats = await fetchApi<GenericThreatWithExtendedThreats[]>(
        request,
        token,
        "GET",
        `/projects/${projectId}/system/threats/generic`
    );
    return genericThreats.flatMap((genericThreat) => genericThreat.threats);
}

export async function createThreat(
    request: APIRequestContext,
    token: string,
    body: CreateThreatRequest
): Promise<Threat> {
    const { projectId, genericThreatId, ...rest } = body;
    return fetchApi(request, token, "POST", `/projects/${projectId}/system/threats/${genericThreatId}`, rest);
}
