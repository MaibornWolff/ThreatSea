/**
 * @module assets.actions - Defines the actions for the assets.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { AssetsAPI } from "#api/assets.api.ts";
import type { Asset, CreateAssetRequest, UpdateAssetRequest } from "#api/types/asset.types.ts";

/**
 * Wrapper class to create action function of the
 * assets.
 */
export class AssetsActions {
    /**
     * Action that gets the assets using the backend
     * with the api.
     * @function getAssets
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the assets.
     * @returns Action function for getting the assets.
     */
    static getAssets = createAsyncThunk("[assets] get assets", async (data: { projectId: number }) => {
        return await AssetsAPI.getAssets(data);
    });

    /**
     * Action that creates an asset using the backend api.
     * @function createAsset
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create an asset.
     * @returns Action function for creating an asset.
     */
    static createAsset = createAsyncThunk("[assets] create asset", async (data: CreateAssetRequest) => {
        return await AssetsAPI.createAsset(data);
    });

    /**
     * Action that updates assets using the backend api.
     * @function updateAsset
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update assets.
     * @returns Action function for updating assets.
     */
    static updateAsset = createAsyncThunk("[assets] update asset", async (data: UpdateAssetRequest) => {
        return await AssetsAPI.updateAsset(data);
    });

    /**
     * Action that deletes assets using the backend api.
     * @function deleteAsset
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to delete assets.
     * @returns Action function for deleting assets.
     */
    static deleteAsset = createAsyncThunk("[assets] delete asset", async (data: Asset) => {
        await AssetsAPI.deleteAsset(data);
        return data;
    });

    /**
     * Action that changes assets.
     * @function setAsset
     * @param {string} type - Action type.
     * @returns Action function for changing assets.
     */
    static setAsset = createAction("[assets] set asset");

    /**
     * Action that removes assets from the redux state.
     * @function removeAsset
     * @param {string} type - Action type.
     * @returns Action function for removing assets.
     */
    static removeAsset = createAction("[assets] remove asset");
}
