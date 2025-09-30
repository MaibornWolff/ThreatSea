import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import { socket } from "../../../api/system-socket.api";
import { AlertActions } from "../../actions/alert.actions";
import { AssetsActions } from "../../actions/assets.actions";
import { EditorActions } from "../../actions/editor.actions";

const asyncThunks = [AssetsActions.updateAsset, AssetsActions.createAsset, AssetsActions.deleteAsset];

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            const { payload } = action;
            if (AssetsActions.deleteAsset.fulfilled.match(action)) {
                socket.emit("remove_asset", JSON.stringify(payload));

                dispatch(AssetsActions.removeAsset(payload));
                dispatch(EditorActions.setAutoSaveStatus("upToDate"));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Asset '${payload.name}' was deleted successfully`,
                    })
                );
            } else {
                socket.emit("set_asset", JSON.stringify(payload));
                dispatch(AssetsActions.setAsset(payload));
                dispatch(EditorActions.setAutoSaveStatus("upToDate"));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Asset '${payload.name}' was saved successfully`,
                    })
                );
            }
        }
    };

const handleFailedRequest =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isRejectedAction(action)) {
            const { arg: data } = action.meta;
            if (AssetsActions.deleteAsset.rejected.match(action)) {
                dispatch(EditorActions.setAutoSaveStatus("failed"));
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to delete Asset '${data.name}'`,
                    })
                );
            } else {
                dispatch(EditorActions.setAutoSaveStatus("failed"));
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to save Asset '${data.name}'`,
                    })
                );
            }
        }
    };

const assetsMiddlewares = [handleSuccessfulRequest, handleFailedRequest];

export default assetsMiddlewares;
