/**
 * @module measures.api - Defines the api calls
 *     for the measures inside a project under system.
 */
import type {
    CreateMeasureImpactRequest,
    MeasureImpact,
    UpdateMeasureImpactRequest,
} from "#api/types/measure-impact.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines functions to do api
 * calls for the measures.
 */
export class MeasureImpactsApi {
    /**
     * Gets all measureImpacts of the current project.
     * @param {number} projectId - id of the current project.
     * @returns Array of measures of this project.
     */
    static async getMeasureImpacts({ projectId }: { projectId: number }): Promise<MeasureImpact[]> {
        return await fetchAPI(`/projects/${projectId}/system/measureImpacts`);
    }

    /**
     * Creates a new measure inside the backend.
     * @param {CreateMeasureImpactRequest} data - Data of the measure.
     * @returns The created measure object.
     */
    static async createMeasureImpact(data: CreateMeasureImpactRequest): Promise<MeasureImpact> {
        const { projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/measureImpacts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Updates a measureImpact inside the backend.
     * @param {UpdateMeasureImpactRequest} data - Data of the measure.
     * @returns The updated measure.
     */
    static async updateMeasureImpact(data: UpdateMeasureImpactRequest): Promise<MeasureImpact> {
        const { id, projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/measureImpacts/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a measureImpact from the backend.
     * @param {MeasureImpact} data - Data of the measure.
     * @returns The deleted measure.
     */
    static async deleteMeasureImpact(data: MeasureImpact) {
        await fetchAPI<void>(`/projects/${data.projectId}/system/measureImpacts/${data.id}`, {
            method: "DELETE",
        });
    }
}
