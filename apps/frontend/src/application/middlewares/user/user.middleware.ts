import { isFulfilled, isRejected } from "@reduxjs/toolkit";
import type { AppMiddleware } from "../types";
import { UserActions } from "../../actions/user.actions";
import { AlertActions } from "../../actions/alert.actions";

const asyncThunks = [UserActions.logOut, UserActions.getAuthStatus] as const;

const isFullfiledAction = isFulfilled(...asyncThunks);

const isRejectedAction = isRejected(...asyncThunks);

const handleSuccessfulRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isFullfiledAction(action)) {
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

const handleFailedRequest: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (isRejectedAction(action)) {
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

const userMiddlewares: AppMiddleware[] = [handleSuccessfulRequest, handleFailedRequest];

export default userMiddlewares;
