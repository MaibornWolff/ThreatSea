import { fetchAPI } from "#api/utils.ts";
import type { Threat, CreateThreatRequest, UpdateThreatRequest } from "#api/types/threat.types.ts";

export class ThreatsAPI {
    static async getThreatsByGenericThreat({
        projectId,
        genericThreatId,
    }: {
        projectId: number;
        genericThreatId: number;
    }): Promise<Threat[]> {
        return await fetchAPI(`/projects/${projectId}/system/threats/${genericThreatId}/list`);
    }

    static async getThreat({ projectId, id }: { projectId: number; id: number }): Promise<Threat> {
        return await fetchAPI(`/projects/${projectId}/system/threats/${id}`);
    }

    static async createThreat(data: CreateThreatRequest): Promise<Threat> {
        const { projectId, genericThreatId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/threats/${genericThreatId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    static async updateThreat(data: UpdateThreatRequest): Promise<Threat> {
        const { id, projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/threats/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    static async deleteThreat(data: { id: number; projectId: number }): Promise<void> {
        const { id, projectId } = data;

        await fetchAPI<void>(`/projects/${projectId}/system/threats/${id}`, {
            method: "DELETE",
        });
    }
}
