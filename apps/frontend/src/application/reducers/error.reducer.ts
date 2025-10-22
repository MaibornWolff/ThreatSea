import { createReducer } from "@reduxjs/toolkit";
import { ErrorActions } from "#application/actions/error.actions.ts";

export const ERR_TYPE_INTERNAL = "ServerError";
export const ERR_TYPE_API = "AuthenticationError";
export const ERR_TYPE_PROJECT_CATALOG_EXISTANCE = "ExistanceError";

export const ERR_MESS_AUTH = "Authentication Error";
export const ERR_MESS_SERVER_INTERNAL = "Internal Server Error";

interface ErrorState {
    type: string;
    message: string;
    errorChanged: boolean;
}

export const errorDefaultState: ErrorState = {
    type: "",
    message: "",
    errorChanged: false,
};

export const errorReducer = createReducer(errorDefaultState, (builder) => {
    builder.addCase(ErrorActions.setAPIError, (state, action) => {
        return {
            type: action.payload.name,
            message: action.payload.message,
            errorChanged: !state.errorChanged,
        };
    });
});
