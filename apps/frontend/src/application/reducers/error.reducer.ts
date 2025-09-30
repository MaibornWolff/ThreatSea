/**
 * @module errors.reducer - Defines the reducer for
 *     the error actions.
 */
import { createReducer } from "@reduxjs/toolkit";
import { ErrorActions } from "#application/actions/error.actions.ts";

// Constants that define the types of errors.
export const ERR_TYPE_INTERNAL = "ServerError";
export const ERR_TYPE_API = "AuthenticationError";
export const ERR_TYPE_PROJECT_CATALOG_EXISTANCE = "ExistanceError";

// Constant that define error messages.
export const ERR_MESS_AUTH = "Authentication Error";
export const ERR_MESS_SERVER_INTERNAL = "Internal Server Error";

/**
 * Initial state of an error.
 *
 * @type {string} type - Type of the error, one of the constants from above.
 * @type {string} message - Message of the error, one of the constants from above.
 * @type {boolean} errorChanged - Indicator if the error has changed, used for alert rendering.
 */
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

/**
 * Reducer for incoming error actions.
 * @function errorReducer
 */
export const errorReducer = createReducer(errorDefaultState, (builder) => {
    builder.addCase(ErrorActions.setAPIError, (state, action) => {
        return {
            type: action.payload.name,
            message: action.payload.message,
            errorChanged: !state.errorChanged,
        };
    });
});
