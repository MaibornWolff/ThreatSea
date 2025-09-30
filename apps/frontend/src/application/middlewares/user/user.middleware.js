import { UserActions } from "../../actions/user.actions";
import { AlertActions } from "../../actions/alert.actions";
import { isFulfilled, isRejected } from "@reduxjs/toolkit";

const asyncThunks = [UserActions.logOut, UserActions.getAuthStatus];

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
            const { payload: meta } = action;
            if (UserActions.logOut.fulfilled.match(action)) {
                dispatch(UserActions.setUserLoggedOut());

                dispatch(
                    AlertActions.openSuccessAlert({
                        text: "Logged out successfully",
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
            const { payload: meta } = action;
            if (UserActions.logOut.rejected.match(action)) {
                dispatch(
                    AlertActions.openErrorAlert({
                        text: "Logged out failed",
                    })
                );
            } else if (UserActions.getAuthStatus.rejected.match(action)) {
                dispatch(UserActions.setUserLoggedOut());
            }
        }
    };

export default [handleSuccessfulRequest, handleFailedRequest];
