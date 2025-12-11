import { createReducer } from "@reduxjs/toolkit";
import { AlertActions } from "#application/actions/alert.actions.ts";

interface AlertState {
    text: string | null;
    type: string | null;
    visible: boolean;
}

const defaultState: AlertState = {
    text: null,
    type: null,
    visible: false,
};

export const alertReducer = createReducer(defaultState, (builder) => {
    builder.addCase(AlertActions.setAlert, (_state, action) => action.payload);

    builder.addCase(AlertActions.closeAlert, () => defaultState);
});
