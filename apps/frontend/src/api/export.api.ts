/**
 * @module export.api - Defines the api calls
 *     for export.
 */
import type { ProjectExport } from "#api/types/export.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines function for the
 * api calls of import.
 */
export class ExportsApi {
    /**
     * Fetches a specific project from the backend.
     * @returns Data of the project as an object.
     */
    static async exportProject(projectId: number): Promise<ProjectExport> {
        return await fetchAPI(`/export/${projectId}`);
    }
}
