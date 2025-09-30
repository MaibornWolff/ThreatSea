/**
 * @module assets.reducer - Defines the reducer for the assets
 *     actions.
 */
import { createReducer } from "@reduxjs/toolkit";
import { AssetsActions } from "../actions/assets.actions";
import { assetsAdapter } from "../adapters/asset.adapter";

/**
 * Initial state of the assets.
 *
 * @type {array of number} ids - ids of the assets.
 * @type {object of objects} entities - Holds the assets mapped to their id.
 *    Entity: @type {number} Key - id of the entity.
 *    Values:
 *         => @type {number} id - id of the asset.
 *         => @type {string} name - The name of the asset.
 *         => @type {string} description - The description of the asset.
 *         => @type {string} integrity - The integrity value of the asset.
 *         => @type {string} confidentiality - The confidentiality value of the asset.
 *         => @type {string} availability - The availability value of the asset.
 *         => @type {string} projectId - The id of the project.
 *         => @type {string} updatedAt - Timestamp when this asset got updated last.
 *         => @type {string} createdAt - Timestamp when this asset got created.
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 */
const defaultState = {
    ...assetsAdapter.getInitialState(),
    isPending: false,
};

/**
 * Reducer for the assets actions.
 * @function assetsReducer
 */
export const assetsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(AssetsActions.getAssets.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(AssetsActions.getAssets.fulfilled, (state, action) => {
        assetsAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(AssetsActions.getAssets.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(AssetsActions.createAsset.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(AssetsActions.createAsset.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(AssetsActions.setAsset, (state, action) => {
        if (action.payload) {
            assetsAdapter.upsertOne(state, action.payload);
        }
        state.isPending = false;
    });

    builder.addCase(AssetsActions.deleteAsset.rejected, (state, action) => {
        console.log(state, action);
    });

    builder.addCase(AssetsActions.removeAsset, (state, action) => {
        if (action.payload && typeof action.payload === "object" && "id" in action.payload) {
            assetsAdapter.removeOne(state, (action.payload as { id: string | number }).id);
        }
        state.isPending = false;
    });
});
