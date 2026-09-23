import { fetchAPI } from "#api/utils.ts";
import type { GenericThreatWithExtendedThreats } from "#api/types/generic-threat.types.ts";

export class GenericThreatsAPI {
    static async getGenericThreatsWithExtendedThreats({
        projectId,
    }: {
        projectId: number;
    }): Promise<GenericThreatWithExtendedThreats[]> {
        return await fetchAPI(`/projects/${projectId}/system/threats/generic`);
    }
}
