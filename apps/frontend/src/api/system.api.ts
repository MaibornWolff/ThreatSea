/**
 * @module system.api - Defines
 *     the api calls for the system.
 */
import type { System, UpdateSystemRequest } from "#api/types/system.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class the defines the api function for
 * the system view.
 */
export class SystemAPI {
    /**
     * Fetches the system view of the current project.
     * @param {number} projectId - id of the current project.
     * @returns The system view object.
     */
    static async getSystem({ projectId }: { projectId: number }): Promise<System> {
        return await fetchAPI(`/projects/${projectId}/system`);
    }

    /**
     * Updates the current system view.
     * @param {object} data - Data of the current system.
     * @returns The updated system view.
     */
    static async updateSystem(updateData: UpdateSystemRequest): Promise<System> {
        const { projectId, data, image } = updateData;

        return await fetchAPI(`/projects/${projectId}/system`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data, image }),
        });
    }
}
