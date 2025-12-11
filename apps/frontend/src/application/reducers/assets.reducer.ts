import { createReducer } from "@reduxjs/toolkit";
import { AssetsActions } from "../actions/assets.actions";
import { assetsAdapter } from "../adapters/asset.adapter";

type AssetsAdapterState = ReturnType<typeof assetsAdapter.getInitialState>;

export type AssetsState = AssetsAdapterState & {
    isPending: boolean;
};

const defaultState: AssetsState = {
    ...assetsAdapter.getInitialState(),
    isPending: false,
};

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
        state.isPending = false;
    });

    builder.addCase(AssetsActions.removeAsset, (state, action) => {
        if (action.payload && typeof action.payload === "object" && "id" in action.payload) {
            assetsAdapter.removeOne(state, action.payload.id);
        }
        state.isPending = false;
    });
});
