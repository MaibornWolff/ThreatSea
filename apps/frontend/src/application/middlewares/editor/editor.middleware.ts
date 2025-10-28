import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "../types";
import { EditorActions } from "../../actions/editor.actions";
import { AlertActions } from "../../actions/alert.actions";
import { socket } from "../../../api/system-socket.api";

const asyncThunks = [
    EditorActions.createComponentType,
    EditorActions.updateComponentType,
    EditorActions.deleteComponentType,
] as const;

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            if (EditorActions.deleteComponentType.fulfilled.match(action)) {
                const { payload: componentType } = action;
                dispatch(EditorActions.removeComponentType(componentType));
                socket.emit("delete_component_type", JSON.stringify(componentType));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Component Type '${componentType.name}' was deleted successfully`,
                    })
                );
            } else if (EditorActions.createComponentType.fulfilled.match(action)) {
                const { payload: componentType } = action;
                dispatch(EditorActions.addComponentType(componentType));
                socket.emit("create_component_type", JSON.stringify(componentType));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Component Type '${componentType.name}' was saved successfully`,
                    })
                );
            } else if (EditorActions.updateComponentType.fulfilled.match(action)) {
                const { payload: componentType } = action;
                dispatch(
                    EditorActions.setComponentType({
                        id: componentType.id,
                        changes: componentType,
                    })
                );
                socket.emit("update_component_type", JSON.stringify(componentType));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Component Type '${componentType.name}' was updated successfully`,
                    })
                );
            }
        }
    };

const handleFailedRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isRejectedAction(action)) {
            const { arg: componentType } = action.meta;
            if (EditorActions.deleteComponentType.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to delete Component Type '${componentType.name}'`,
                    })
                );
            } else {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to save Component Type '${componentType.name}'`,
                    })
                );
            }
        }
    };

const handleSelectAnchor: AppMiddleware = () => (next) => (action) => {
    next(action);
};

const editorMiddlewares: AppMiddleware[] = [handleSelectAnchor, handleFailedRequest, handleSuccessfulRequest];

export default editorMiddlewares;
