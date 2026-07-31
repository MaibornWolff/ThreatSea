/**
 * @module folders.api - Defines the api calls for per-user project folders.
 */
import type { CreateFolderRequest, Folder, MoveProjectRequest, UpdateFolderRequest } from "#api/types/folder.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines the api calls for a folder.
 */
export class FoldersAPI {
    /**
     * Gets all folders of the current user from the backend.
     * @returns An array of folder objects.
     */
    static async getFolders(): Promise<Folder[]> {
        return await fetchAPI("/folders");
    }

    /**
     * Creates a folder inside the backend.
     * @param {CreateFolderRequest} data - Data of the folder.
     * @returns The created folder.
     */
    static async createFolder(data: CreateFolderRequest): Promise<Folder> {
        return await fetchAPI("/folders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
    }

    /**
     * Renames and/or moves a folder inside the backend.
     * @param {UpdateFolderRequest} data - The updated folder data.
     * @returns The updated folder.
     */
    static async updateFolder(data: UpdateFolderRequest): Promise<Folder> {
        const { id, ...body } = data;

        return await fetchAPI(`/folders/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a folder inside the backend.
     * @param {Folder} data - Data of the folder.
     */
    static async deleteFolder(data: Folder): Promise<void> {
        await fetchAPI<void>(`/folders/${data.id}`, {
            method: "DELETE",
        });
    }

    /**
     * Files a project into a folder, or ungroups it when folderId is null. A folder owns a
     * project via the caller's membership, so filing is a PUT to the target folder and
     * ungrouping is a DELETE from the folder the project currently sits in.
     * @param {MoveProjectRequest} data - The project id, target folder, and current folder.
     * @returns The updated project.
     */
    static async moveProject(data: MoveProjectRequest): Promise<ExtendedProject> {
        const { projectId, folderId, currentFolderId } = data;

        if (folderId === null) {
            if (currentFolderId === null) {
                throw new Error("Project is already ungrouped");
            }
            return await fetchAPI(`/folders/${currentFolderId}/projects/${projectId}`, {
                method: "DELETE",
            });
        }

        return await fetchAPI(`/folders/${folderId}/projects/${projectId}`, {
            method: "PUT",
        });
    }
}
