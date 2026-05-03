import { fetchAPI } from "#api/utils.ts";
import type { ChildThreat } from "#api/types/child-threat.types.ts";

export class ChildThreatsAPI {
    static async getChildThreatsByGenericThreat({ projectId, genericThreatId }: { projectId: number; genericThreatId: number }): Promise<ChildThreat[]> {
        return await fetchAPI(`/projects/${projectId}/system/genericThreats/${genericThreatId}/childThreats`);
    }

    static async getChildThreat({ projectId, genericThreatId, id }: { projectId: number; genericThreatId: number; id: number }): Promise<ChildThreat> {
        return await fetchAPI(`/projects/${projectId}/system/genericThreats/${genericThreatId}/childThreats/${id}`);
    }

    static async createChildThreat(data: { projectId: number; [key: string]: any }): Promise<ChildThreat> {
        const { projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/childThreats`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    static async updateChildThreat(data: { id: number; projectId: number; [key: string]: any }): Promise<ChildThreat> {
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

export default ChildThreatsAPI;
