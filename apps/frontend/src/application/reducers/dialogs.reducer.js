/**
 * @module dialogs.reducer - Defines the reducer for
 *     the fillable dialogs.
 */

import { createReducer } from "@reduxjs/toolkit";
import { DialogsActions } from "../actions/dialogs.actions";

/**
 * The initial state for the fillable dialogs.
 */
const defaultState = {};

/**
 * Reducer for the fillable dialogs to change state upon receiving actions.
 * @function dialogsReducer
 */
const dialogsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(DialogsActions.setValue, (state, action) => {
        const {
            payload: { nameSpace, data },
        } = action;
        state[nameSpace] = {
            ...state[nameSpace],
            ...data,
        };
    });

    builder.addCase(DialogsActions.cancelDialog, (state, action) => {
        const {
            payload: { nameSpace },
        } = action;
        state[nameSpace] = null;
    });

    builder.addCase(DialogsActions.setError, (state, action) => {
        const {
            payload: { nameSpace, error },
        } = action;

        return {
            ...state,
            [nameSpace]: {
                ...state[nameSpace],
                error: {
                    ...state[nameSpace].error,
                    ...error,
                },
            },
        };
    });
});

export default dialogsReducer;
