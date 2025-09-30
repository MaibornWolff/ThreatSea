/**
 * @module threats.api - Defines
 *     the api calls for the threats of a project => threatview.
 */
import type { CreateThreatRequest, ExtendedThreat, Threat, UpdateThreatRequest } from "#api/types/threat.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that exposes the api functions
 * for the threads.
 */
export class ThreatsAPI {
    /**
     * Fetches the current threats of the project.
     * @param {number} projectId - id of the current project.
     * @returns Array of threat objects.
     */
    static async getThreats({ projectId }: { projectId: number }): Promise<ExtendedThreat[]> {
        return await fetchAPI(`/projects/${projectId}/system/threats`);
    }

    /**
     * Creates a threat for the given project inside the backend.
     * @param {CreateThreatRequest} data - Data of the new threat.
     * @returns The created threat.
     */
    static async createThreat(data: CreateThreatRequest): Promise<Threat> {
        const { projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/threats`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Updates a threat for the given project inside the backend.
     * @param {UpdateThreatRequest} data - Data of the updated threat.
     * @returns The updated threat.
     */
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

    /**
     * Deletes a threat inside the backend.
     * @param {Threat} data - Date of the threat to delete.
     * @returns The deleted threat.
     */
    static async deleteThreat(data: Threat) {
        await fetchAPI(`/projects/${data.projectId}/system/threats/${data.id}`, {
            method: "DELETE",
        });
    }
}
