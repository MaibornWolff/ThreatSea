import { fetchAPI } from "#api/utils.ts";
import type { GenericThreat, GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";

export class GenericThreatsAPI {
    static async getGenericThreats({ projectId }: { projectId: number }): Promise<GenericThreat[]> {
        return await fetchAPI(`/projects/${projectId}/system/genericThreats`);
    }

    static async getGenericThreatsWithExtendedChildren({
        projectId,
    }: {
        projectId: number;
    }): Promise<GenericThreatWithExtendedChildren[]> {
        return await fetchAPI(`/projects/${projectId}/system/genericThreats/with-children`);
    }
}
