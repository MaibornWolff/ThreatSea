/**
 * Module that defines the access and manipulation
 * for the assets of a project.
 */
import { eq, inArray, and, ne } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { Asset, assets, CreateAsset, UpdateAsset } from "#db/schema.js";
import { ConflictError } from "#errors/conflict.error.js";

/**
 * Gets all assets of the specified project.
 *
 * @param {number} projectId - The id of the current project.
 * @returns {Promise<Asset[]>} A promise that resolves to an array of assets.
 */
export async function getAssets(projectId: number): Promise<Asset[]> {
    return await db.query.assets.findMany({ where: eq(assets.projectId, projectId) });
}

/**
 * Gets a specific asset by its id.
 *
 * @param {number} assetId - The id of the asset.
 * @returns {Promise<Asset | null>} A promise that resolves to the asset or null if not found.
 */
export async function getAsset(assetId: number): Promise<Asset | null> {
    const asset = await db.query.assets.findFirst({ where: eq(assets.id, assetId) });

    return asset ?? null;
}

/**
 * Gets multiple assets by their ids.
 *
 * @param {number[]} assetIds
 * @returns {Promise<Asset[]>} A promise that resolves to an array of assets.
 */
export async function getMultipleAssets(assetIds: number[]): Promise<Asset[]> {
    return await db.query.assets.findMany({
        where: inArray(assets.id, assetIds),
    });
}

/**
 * Creates a new asset.
 *
 * @param {CreateAsset} createAssetData - Data of the asset.
 * @returns {Promise<Asset>} A promise that resolves to the created asset.
 * @throws {Error} If the asset could not be created.
 */
export async function createAsset(createAssetData: CreateAsset): Promise<Asset> {
    const assetsWithDuplicateName = await db.query.assets.findFirst({
        where: and(eq(assets.projectId, createAssetData.projectId), eq(assets.name, createAssetData.name)),
    });

    if (assetsWithDuplicateName != null) {
        throw new ConflictError("Asset name is not unique");
    }

    const [asset] = await db.insert(assets).values(createAssetData).returning();

    if (!asset) {
        throw new Error("Failed to create asset");
    }

    return asset;
}

/**
 * Imports multiple assets.
 *
 * @param {CreateAsset[]} createAssetsData - Array of objects
 *     that hold the data of the imported assets.
 * @param {TransactionType} transaction - drizzle transaction
 * @returns {Promise<Asset[]>} A promise that resolves to the imported assets.
 */
export async function importAssets(
    createAssetsData: CreateAsset[],
    transaction: TransactionType | undefined = undefined
): Promise<Asset[]> {
    return await (transaction ?? db).insert(assets).values(createAssetsData).returning();
}

/**
 * Updates the asset with the specified id.
 *
 * @param {number} projectId - The id of the current project.
 * @param {number} assetId - The id of the asset to update.
 * @param {UpdateAsset} updateAssetData - Asset data.
 * @returns {Promise<Asset>} A promise that resolves to the updated asset.
 * @throws {Error} If the asset could not be updated.
 */
export async function updateAsset(projectId: number, assetId: number, updateAssetData: UpdateAsset): Promise<Asset> {
    const assetsWithDuplicateName = await db.query.assets.findFirst({
        where: and(eq(assets.projectId, projectId), eq(assets.name, updateAssetData.name), ne(assets.id, assetId)),
    });

    if (assetsWithDuplicateName != null) {
        throw new ConflictError("Asset name is not unique");
    }

    const [asset] = await db.update(assets).set(updateAssetData).where(eq(assets.id, assetId)).returning();

    if (!asset) {
        throw new Error("Failed to update asset");
    }

    return asset;
}

/**
 * Deletes the asset with the specified id.
 *
 * @param {number} assetId - The asset id.
 * @return {Promise<void>} A promise that resolves when the asset is deleted.
 */
export async function deleteAsset(assetId: number): Promise<void> {
    await db.delete(assets).where(eq(assets.id, assetId));
}
