import { createReducer } from "@reduxjs/toolkit";
import { DialogsActions } from "../actions/dialogs.actions";

type DialogError = Record<string, unknown>;

export type DialogValue = Record<string, unknown> & {
    error?: DialogError | null;
};

export type DialogsState = Record<string, DialogValue | null | undefined>;

const defaultState: DialogsState = {};

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
                    ...state[nameSpace]?.error,
                    ...error,
                },
            },
        };
    });
});

export default dialogsReducer;
