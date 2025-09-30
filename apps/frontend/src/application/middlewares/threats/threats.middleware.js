import { AlertActions } from "../../actions/alert.actions";
import { ThreatsActions } from "../../actions/threats.actions";
import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import { socket } from "../../../api/system-socket.api";

const asyncThunks = [
    ThreatsActions.updateThreat,
    ThreatsActions.createThreat,
    ThreatsActions.deleteThreat,
    ThreatsActions.deleteThreat,
];

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            const { payload: threat } = action;

            if (ThreatsActions.deleteThreat.fulfilled.match(action)) {
                dispatch(ThreatsActions.removeThreat(threat));
                socket.emit("remove_threat", JSON.stringify(threat));
                dispatch(
                    AlertActions.openSuccessAlert({
                        text: `Threat '${threat.name}' was deleted successfully`,
                    })
                );
            } else {
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

const handleFailedRequest =
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

export default [handleSuccessfulRequest, handleFailedRequest];
