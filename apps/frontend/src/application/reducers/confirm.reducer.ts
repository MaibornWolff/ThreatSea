import { createReducer } from "@reduxjs/toolkit";
import { ConfirmActions } from "#application/actions/confirm.actions.ts";

export interface ConfirmState {
    open: boolean;
    message: string;
    cancelText: string | null;
    acceptText: string | null;
}

const defaultState: ConfirmState = {
    open: false,
    message: "",
    cancelText: null,
    acceptText: null,
};

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
