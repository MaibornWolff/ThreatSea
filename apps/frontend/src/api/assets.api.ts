/**
 * @module asset.api - Defines api calls to the backend
 *     for the assets.
 */
import type { CreateAssetRequest, Asset, UpdateAssetRequest } from "#api/types/asset.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class for the api function of an asset.
 */
export class AssetsAPI {
    /**
     * Get all assets of a project.
     * @param {number} projectId - id of the current project.
     * @returns Array of asset objects.
     */
    static async getAssets({ projectId }: { projectId: number }): Promise<Asset[]> {
        return await fetchAPI(`/projects/${projectId}/assets`);
    }

    /**
     * Creates an asset inside the backend.
     * @param {CreateAssetRequest} data - Data of the asset.
     * @returns Object with data of the asset.
     */
    static async createAsset(data: CreateAssetRequest): Promise<Asset> {
        const { projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/assets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Updates an asset in the backend.
     * @param {UpdateAssetRequest} data - Data of the asset.
     * @returns The updated asset.
     */
    static async updateAsset(data: UpdateAssetRequest): Promise<Asset> {
        const { id, projectId, ...body } = data;

        return await fetchAPI(`/projects/${projectId}/assets/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes an asset from the backend.
     * @param {Asset} data - Data of the asset.
     */
    static async deleteAsset(data: Asset) {
        await fetchAPI<void>(`/projects/${data.projectId}/assets/${data.id}`, {
            method: "DELETE",
        });
    }
}
