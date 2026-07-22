import { createReducer } from "@reduxjs/toolkit";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { foldersAdapter } from "#application/adapters/folder.adapter.ts";

type FoldersAdapterState = ReturnType<typeof foldersAdapter.getInitialState>;

export type FoldersState = FoldersAdapterState & {
    isPending: boolean;
    isLoadingAll: boolean;
};

const defaultState: FoldersState = {
    ...foldersAdapter.getInitialState(),
    isPending: false,
    isLoadingAll: false,
};

const foldersReducer = createReducer(defaultState, (builder) => {
    builder.addCase(FoldersActions.getFolders.pending, (state) => {
        state.isPending = true;
        state.isLoadingAll = true;
    });

    builder.addCase(FoldersActions.getFolders.fulfilled, (state, action) => {
        foldersAdapter.setAll(state, action);
        state.isPending = false;
        state.isLoadingAll = false;
    });

    builder.addCase(FoldersActions.getFolders.rejected, (state) => {
        state.isPending = false;
        state.isLoadingAll = false;
    });

    builder.addCase(FoldersActions.createFolder.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(FoldersActions.createFolder.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(FoldersActions.setFolder, (state, action) => {
        foldersAdapter.upsertOne(state, action.payload);
        state.isPending = false;
    });

    builder.addCase(FoldersActions.removeFolder, (state, action) => {
        foldersAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
    });
});

export default foldersReducer;
