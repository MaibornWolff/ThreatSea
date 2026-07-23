/**
 * @module folders.actions - Defines the actions for the folders.
 */
import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { FoldersAPI } from "#api/folders.api.ts";
import type { CreateFolderRequest, Folder, MoveProjectRequest, UpdateFolderRequest } from "#api/types/folder.types.ts";

/**
 * Wrapper class that exposes functions for the folder actions.
 */
export class FoldersActions {
    /**
     * Action that gets the folders of the current user using the backend api.
     */
    static readonly getFolders = createAsyncThunk(
        "[folders] get folders",
        async () => {
            return await FoldersAPI.getFolders();
        },
        {
            condition: (_, { getState }) => {
                const state = getState() as { folders: { isLoadingAll: boolean } };
                return !state.folders.isLoadingAll;
            },
        }
    );

    /**
     * Action that creates a folder using the backend api.
     */
    static readonly createFolder = createAsyncThunk("[folders] create folder", async (data: CreateFolderRequest) => {
        return await FoldersAPI.createFolder(data);
    });

    /**
     * Action that renames and/or moves a folder using the backend api.
     */
    static readonly updateFolder = createAsyncThunk("[folders] update folder", async (data: UpdateFolderRequest) => {
        return await FoldersAPI.updateFolder(data);
    });

    /**
     * Action that deletes a folder using the backend api.
     */
    static readonly deleteFolder = createAsyncThunk("[folders] delete folder", async (data: Folder) => {
        await FoldersAPI.deleteFolder(data);
        return data;
    });

    /**
     * Action that moves a project into (or out of) a folder using the backend api.
     */
    static readonly moveProject = createAsyncThunk("[folders] move project", async (data: MoveProjectRequest) => {
        return await FoldersAPI.moveProject(data);
    });

    /**
     * Action that upserts a folder in the redux store.
     */
    static readonly setFolder = createAction<Folder>("[folders] set folder");

    /**
     * Action that removes a folder from the redux store.
     */
    static readonly removeFolder = createAction<Folder>("[folders] remove folder");

    /**
     * Action that toggles whether an accordion section is collapsed. The payload is the section key:
     * a folder id as a string, or "ungrouped" for the ungrouped section.
     */
    static readonly toggleFolderCollapsed = createAction<string>("[folders] toggle folder collapsed");
}
