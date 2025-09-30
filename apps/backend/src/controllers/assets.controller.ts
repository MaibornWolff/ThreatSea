/**
 * Module that defines the controller functions
 * for the asset routes.
 */
import { NextFunction, Request, Response } from "express";
import * as AssetsService from "#services/assets.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { AssetIdParam, AssetResponse, CreateAssetRequest, UpdateAssetRequest } from "#types/asset.types.js";
import { ProjectIdParam } from "#types/project.types.js";

/**
 * Gets all the assets of the specified project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getAssets(
    request: Request<ProjectIdParam, AssetResponse[]>,
    response: Response<AssetResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const assets: AssetResponse[] = await AssetsService.getAssets(projectId);

    response.json(assets);
}

/**
 * Creates an asset.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function createAsset(
    request: Request<ProjectIdParam, AssetResponse, CreateAssetRequest>,
    response: Response<AssetResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const data = request.body;

    try {
        const asset: AssetResponse = await AssetsService.createAsset({ ...data, projectId });

        response.json(asset);
    } catch (error) {
        next(error);
    }
}

/**
 * Updates an asset.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateAsset(
    request: Request<AssetIdParam, AssetResponse, UpdateAssetRequest>,
    response: Response<AssetResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const assetId = request.params.assetId;

    const asset: AssetResponse | null = await AssetsService.getAsset(assetId);

    if (asset === null) {
        next(new NotFoundError("Asset not found"));
        return;
    }
    if (asset.projectId !== projectId) {
        next(new BadRequestError("Asset is not part of this project"));
        return;
    }

    const data = request.body;
    try {
        const updatedAsset: AssetResponse = await AssetsService.updateAsset(projectId, assetId, data);

        response.json(updatedAsset);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes an asset.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteAsset(
    request: Request<AssetIdParam, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const assetId = request.params.assetId;

    const asset: AssetResponse | null = await AssetsService.getAsset(assetId);

    if (asset === null) {
        next(new NotFoundError("Asset not found"));
        return;
    }
    if (asset.projectId !== projectId) {
        next(new BadRequestError("Asset is not part of this project"));
        return;
    }

    await AssetsService.deleteAsset(assetId);

    response.sendStatus(204);
}
