/**
 * @module alert.reducer - Defines the reducer for the alert
 *     actions.
 */
import { createReducer } from "@reduxjs/toolkit";
import { AlertActions } from "#application/actions/alert.actions.ts";

/**
 * @type {string} text - Message of the alert.
 * @type {string} type - Type of the alert e.g error.
 * @type {boolean} visible - Indicator if the alert is visible.
 */
interface AlertState {
    text: string | null;
    type: string | null;
    visible: boolean;
}

/**
 * Initial state of the alert.
 */
const defaultState: AlertState = {
    text: null,
    type: null,
    visible: false,
};

/**
 * Reducer that updates the current state based on incoming actions.
 * @function alertReducer
 */
export const alertReducer = createReducer(defaultState, (builder) => {
    builder.addCase(AlertActions.setAlert, (_state, action) => action.payload);

    builder.addCase(AlertActions.closeAlert, () => defaultState);
});
