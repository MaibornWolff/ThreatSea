import { fetchAPI } from "#api/utils.ts";
import type { ChildThreat, CreateChildThreatRequest, UpdateChildThreatRequest } from "#api/types/child-threat.types.ts";

export class ChildThreatsAPI {
    static async getChildThreatsByGenericThreat({
        projectId,
        genericThreatId,
    }: {
        projectId: number;
        genericThreatId: number;
    }): Promise<ChildThreat[]> {
        return await fetchAPI(`/projects/${projectId}/system/childThreats/${genericThreatId}/list`);
    }

    static async getChildThreat({ projectId, id }: { projectId: number; id: number }): Promise<ChildThreat> {
        return await fetchAPI(`/projects/${projectId}/system/childThreats/${id}`);
    }

    static async createChildThreat(data: CreateChildThreatRequest): Promise<ChildThreat> {
        const { projectId, genericThreatId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/childThreats/${genericThreatId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    static async updateChildThreat(data: UpdateChildThreatRequest): Promise<ChildThreat> {
        const { id, projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/childThreats/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    static async deleteChildThreat(data: { id: number; projectId: number }): Promise<void> {
        const { id, projectId } = data;

        await fetchAPI<void>(`/projects/${projectId}/system/childThreats/${id}`, {
            method: "DELETE",
        });
    }
}
