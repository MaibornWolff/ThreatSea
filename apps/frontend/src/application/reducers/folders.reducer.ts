import { createReducer } from "@reduxjs/toolkit";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { foldersAdapter } from "#application/adapters/folder.adapter.ts";

type FoldersAdapterState = ReturnType<typeof foldersAdapter.getInitialState>;

export type FoldersState = FoldersAdapterState & {
    isPending: boolean;
    isLoadingAll: boolean;
    // Which accordion sections are collapsed, keyed by folder id (or "ungrouped"). Absent = expanded,
    // so a fresh store (first load / after a refresh) shows everything expanded. Lives in redux — not
    // localStorage — so it survives navigating in and out of a project but resets on a page refresh.
    collapsed: Record<string, boolean>;
};

const defaultState: FoldersState = {
    ...foldersAdapter.getInitialState(),
    isPending: false,
    isLoadingAll: false,
    collapsed: {},
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

    builder.addCase(FoldersActions.toggleFolderCollapsed, (state, action) => {
        const key = action.payload;
        if (state.collapsed[key]) {
            delete state.collapsed[key];
        } else {
            state.collapsed[key] = true;
        }
    });
});

export default foldersReducer;
