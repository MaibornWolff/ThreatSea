import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "../types";
import { AlertActions } from "../../actions/alert.actions";
import { ThreatsActions } from "../../actions/threats.actions";
import { socket } from "../../../api/system-socket.api";

const asyncThunks = [
    ThreatsActions.updateThreat,
    ThreatsActions.createThreat,
    ThreatsActions.deleteThreat,
    ThreatsActions.deleteThreat,
] as const;

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            if (ThreatsActions.deleteThreat.fulfilled.match(action)) {
                const { payload: threat } = action;
                dispatch(ThreatsActions.removeThreat(threat));
                socket.emit("remove_threat", JSON.stringify(threat));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Threat '${threat.name}' was deleted successfully`,
                    })
                );
            } else {
                const { payload: threat } = action;
                dispatch(ThreatsActions.setThreat(threat));

                socket.emit("set_threat", JSON.stringify(threat));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Threat '${threat.name}' was saved successfully`,
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
            const { arg: threat } = action.meta;
            if (ThreatsActions.deleteThreat.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to delete Threat '${threat.name}'`,
                    })
                );
            } else {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: `Failed to save Threat '${threat.name}'`,
                    })
                );
            }
        }
    };

const threatsMiddlewares: AppMiddleware[] = [handleSuccessfulRequest, handleFailedRequest];

export default threatsMiddlewares;
