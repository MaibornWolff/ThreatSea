/**
 * @module projects.api - Defines the api calls
 *     for a project.
 */
import type {
    CreateProjectRequest,
    ExtendedProject,
    Project,
    ProjectReport,
    UpdateProjectRequest,
} from "#api/types/project.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines function for the
 * api calls of a project.
 */
export class ProjectsAPI {
    /**
     * Gets all projects from the backend.
     * @returns An array of project objects.
     */
    static async getProjects(): Promise<ExtendedProject[]> {
        return await fetchAPI("/projects");
    }

    /**
     * Fetches a specific project from the backend.
     * @returns Data of the project as an object.
     */
    static async getProject(projectId: number): Promise<ExtendedProject> {
        return await fetchAPI(`/projects/${projectId}`);
    }

    /**
     * Creates a project inside the backend.
     * @param {CreateProjectRequest} data - Data of the project.
     * @returns The created project.
     */
    static async createProject(data: CreateProjectRequest): Promise<Project> {
        return await fetchAPI("/projects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
    }

    /**
     * Updates a project inside the backend api.
     * @param {UpdateProjectRequest} data - The updates project data.
     * @returns The updated project.
     */
    static async updateProject(data: UpdateProjectRequest): Promise<Project> {
        const { id, ...body } = data;

        return await fetchAPI(`/projects/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a project inside the backend.
     * @param {Project} data - Data of the project
     * @returns The deleted project object.
     */
    static async deleteProject(data: Project) {
        await fetchAPI<void>(`/projects/${data.id}`, {
            method: "DELETE",
        });
    }

    /**
     * Gets the report data from the backend for
     * the specified project.
     * @param {number} projectId - id of the current project.
     * @returns The report data.
     */
    static async getReport({ projectId }: { projectId: number }): Promise<ProjectReport> {
        return await fetchAPI(`/projects/${projectId}/report`);
    }
}
