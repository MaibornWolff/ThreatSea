import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import { socket } from "../../../api/system-socket.api";
import { AlertActions } from "../../actions/alert.actions";
import { ProjectsActions } from "../../actions/projects.actions";

const asyncThunks = [ProjectsActions.createProject, ProjectsActions.updateProject, ProjectsActions.deleteProject];

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            const { payload: project } = action;
            if (ProjectsActions.deleteProject.fulfilled.match(action)) {
                socket.emit("remove_project", JSON.stringify(project));
                dispatch(ProjectsActions.removeProject(project));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Project '${project.name}' was deleted successfully`,
                    })
                );
            } else {
                socket.emit("set_project", JSON.stringify(project));
                dispatch(ProjectsActions.setProject(project));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Project '${project.name}' was saved successfully`,
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
            const { arg: project } = action.meta;
            dispatch(
                AlertActions.openErrorAlert({
                    text: `Failed to save Project '${project.name}'`,
                })
            );
        }
    };

const projectsMiddlewares = [handleFailedRequest, handleSuccessfulRequest];

export default projectsMiddlewares;
