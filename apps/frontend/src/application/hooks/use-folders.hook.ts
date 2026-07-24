import { useCallback } from "react";
import type { Folder, MoveProjectRequest } from "#api/types/folder.types.ts";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { foldersSelectors } from "#application/selectors/folders.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useFolders = () => {
    const dispatch = useAppDispatch();
    const items = useAppSelector(foldersSelectors.selectAll);
    const isPending = useAppSelector((state) => state.folders.isPending);

    const loadFolders = useCallback(() => {
        dispatch(FoldersActions.getFolders());
    }, [dispatch]);

    const deleteFolder = (folder: Folder) => {
        dispatch(FoldersActions.deleteFolder(folder));
    };

    const moveProject = (data: MoveProjectRequest) => {
        dispatch(FoldersActions.moveProject(data));
    };

    return {
        items,
        isPending,
        loadFolders,
        deleteFolder,
        moveProject,
    };
};
