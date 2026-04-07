import { fetchAPI } from "#api/utils.ts";
import type { ChildThreat } from "#api/types/child-threat.types.ts";

export class ChildThreatsAPI {
    static async getChildThreatsByGenericThreatId({
        projectId,
        genericThreatId,
    }: {
        projectId: number;
        genericThreatId: number;
    }): Promise<ChildThreat[]> {
        return await fetchAPI(`/projects/${projectId}/system/genericThreats/${genericThreatId}/child-threats`);
    }
}
