/**
 * @module confirm.reducer - Reducer
 *     for the confirm dialogs.
 */
import { createReducer } from "@reduxjs/toolkit";
import { ConfirmActions } from "#application/actions/confirm.actions.ts";

/**
 * @type {boolean} open - Indicator that a confirm dialog is open or not.
 * @type {string} message - Message of the dialog.
 * @type {string} cancelText - Text of the cancel button of the dialog.
 * @type {string} acceptText - Text of the accept button of the dialog.
 */
interface ConfirmState {
    open: boolean;
    message: string;
    cancelText: string | null;
    acceptText: string | null;
}

/**
 * Initial state of the confirm dialog.
 */
const defaultState: ConfirmState = {
    open: false,
    message: "",
    cancelText: null,
    acceptText: null,
};

/**
 * Reducer for changing the state of the confirm dialog
 * by the incoming actions.
 * @function confirmReducer
 */
export const confirmReducer = createReducer(defaultState, (builder) => {
    builder.addCase(ConfirmActions.openConfirm, (_state, action) => {
        return {
            ...action.payload,
            open: true,
        };
    });

    builder.addCase(ConfirmActions.cancelConfirm, () => ({
        ...defaultState,
        open: false,
    }));

    builder.addCase(ConfirmActions.acceptConfirm, () => ({
        ...defaultState,
        open: false,
    }));
});
