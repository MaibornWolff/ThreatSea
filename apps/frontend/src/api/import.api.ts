/**
 * @module projects.api - Defines the api calls
 *     for a project.
 */
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines function for the
 * api calls of import.
 */
export class ImportsApi {
    /**
     * Imports a project inside the backend.
     * @param {object} data - Data of the project.
     * @returns The created project.
     */
    static async importProjectFromJson(data: object) {
        return await fetchAPI<void>("/import", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
    }
}
