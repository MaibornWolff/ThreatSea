/**
 * @module alert.middlware - Defines middleware functions
 *     for the alert.
 */

import type { AppMiddleware } from "../types";
import { AlertActions } from "../../actions/alert.actions";

/**
 * Middleware function for redux success alert action.
 *
 * @param {Object} dispatch - Dispatch function of the alert component.
 * @returns Function which is called before the actual action.
 */
const handleOpenSuccessAlert: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);

        if (AlertActions.openSuccessAlert.match(action)) {
            const {
                payload: { text, duration },
            } = action;

            dispatch(
                AlertActions.setAlert({
                    text,
                    duration,
                    visible: true,
                    type: "success",
                })
            );
        }
    };

/**
 * Middleware function for redux error alert action.
 *
 * @param {Object} dispatch - Dispatch function of the alert component.
 * @returns Function which is called before the actual action.
 */
const handleOpenErrorAlert: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);

        if (AlertActions.openErrorAlert.match(action)) {
            const {
                payload: { text, duration },
            } = action;
            dispatch(
                AlertActions.setAlert({
                    text,
                    duration,
                    visible: true,
                    type: "error",
                })
            );
        }
    };

/**
 * Middleware function for redux setalert action.
 *
 * @param {Object} dispatch - Dispatch function of the alert component.
 * @returns Function which is called before the actual action.
 */
const handleCloseOnTimeout: AppMiddleware =
    ({ dispatch }) =>
    (next) =>
    (action) => {
        next(action);
        if (AlertActions.setAlert.match(action)) {
            const {
                payload: { duration },
            } = action;
            if (duration) {
                setTimeout(() => {
                    dispatch(AlertActions.closeAlert());
                }, duration);
            }
        }
    };

// Combines as an array for the export.
const alertMiddlewares: AppMiddleware[] = [handleCloseOnTimeout, handleOpenErrorAlert, handleOpenSuccessAlert];

export default alertMiddlewares;
