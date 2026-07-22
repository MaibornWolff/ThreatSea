import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "#application/middlewares/types.ts";
import { AlertActions } from "#application/actions/alert.actions.ts";
import { FoldersActions } from "#application/actions/folders.actions.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";

const saveThunks = [FoldersActions.createFolder, FoldersActions.updateFolder] as const;

const isSavedAction = isFulfilled(...saveThunks);
const isSaveRejectedAction = isRejected(...saveThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);

        if (isSavedAction(action)) {
            const folder = action.payload;
            dispatch(FoldersActions.setFolder(folder));
            dispatch(
                AlertActions.openSuccessAlert({
                    text: `Folder '${folder.name}' was saved successfully`,
                })
            );
        }

        if (FoldersActions.deleteFolder.fulfilled.match(action)) {
            const folder = action.payload;
            // Deleting a folder cascades to its subtree and ungroups contained projects on the
            // server, so resync both resources rather than removing a single entity.
            dispatch(FoldersActions.getFolders());
            dispatch(ProjectsActions.getProjects());
            dispatch(
                AlertActions.openSuccessAlert({
                    text: `Folder '${folder.name}' was deleted successfully`,
                })
            );
        }

        if (FoldersActions.moveProject.fulfilled.match(action)) {
            const project = action.payload;
            // Update only the placement so the project's role is not touched (a viewer may move too).
            dispatch(ProjectsActions.setProjectFolder({ id: project.id, folderId: project.folderId }));
        }
    };

const handleFailedRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);

        if (isSaveRejectedAction(action)) {
            dispatch(AlertActions.openErrorAlert({ text: "Failed to save folder" }));
        }

        if (FoldersActions.deleteFolder.rejected.match(action)) {
            dispatch(AlertActions.openErrorAlert({ text: "Failed to delete folder" }));
        }

        if (FoldersActions.moveProject.rejected.match(action)) {
            dispatch(AlertActions.openErrorAlert({ text: "Failed to move project" }));
        }
    };

const foldersMiddlewares: AppMiddleware[] = [handleFailedRequest, handleSuccessfulRequest];

export default foldersMiddlewares;
