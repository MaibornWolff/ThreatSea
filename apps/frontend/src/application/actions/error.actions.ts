/**
 * @module error.actions - Defines the actions for
 *     the non fatal error handling.
 */
import { createAction, type SerializedError } from "@reduxjs/toolkit";

/**
 * Wrapper class to expose functions for
 * the error actions.
 */
export class ErrorActions {
    /**
     * Action that sets an api error.
     * @function setAPIError
     * @param {string} type - Action type.
     * @returns Action function for setting an api error.
     */
    static setAPIError = createAction<SerializedError>("[error] api request failure");
}
