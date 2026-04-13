import { fetchAPI } from "#api/utils.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";

export class GenericThreatsAPI {
    static async getGenericThreatsWithExtendedChildren({
        projectId,
    }: {
        projectId: number;
    }): Promise<GenericThreatWithExtendedChildren[]> {
        return await fetchAPI(`/projects/${projectId}/system/genericThreats/with-children-extended`);
    }
}
