/**
 * @module measures.api - Defines the api calls
 *     for the measures inside a project under system.
 */
import type { CreateMeasureRequest, Measure, UpdateMeasureRequest } from "#api/types/measure.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines functions to do api
 * calls for the measures.
 */
export class MeasuresAPI {
    /**
     * Gets all measures of the current project.
     * @param {number} projectId - id of the current project.
     * @returns Array of measures of this project.
     */
    static async getMeasures({ projectId }: { projectId: number }): Promise<Measure[]> {
        return await fetchAPI(`/projects/${projectId}/system/measures`);
    }

    /**
     * Creates a new measure inside the backend.
     * @param {CreateMeasureRequest} data - Data of the measure.
     * @returns The created measure object.
     */
    static async createMeasure(data: CreateMeasureRequest): Promise<Measure> {
        const { projectId, ...body } = data;

        return fetchAPI(`/projects/${projectId}/system/measures`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Updates a measure inside the backend.
     * @param {UpdateMeasureRequest} data - Data of the measure.
     * @returns The updated measure.
     */
    static async updateMeasure(data: UpdateMeasureRequest): Promise<Measure> {
        const { id, projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/system/measures/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a measure from the backend.
     * @param {Measure} data - Data of the measure.
     * @returns The deleted measure.
     */
    static async deleteMeasure(data: Measure) {
        await fetchAPI<void>(`/projects/${data.projectId}/system/measures/${data.id}`, {
            method: "DELETE",
        });
    }
}
