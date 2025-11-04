import { createReducer } from "@reduxjs/toolkit";
import { ConfirmActions } from "#application/actions/confirm.actions.ts";

export type ConfirmMessage =
    | string
    | {
          preHighlightText?: string;
          highlightedText?: string;
          afterHighlightText?: string;
      };

export type ConfirmAcceptColor = "primary" | "secondary" | "error" | "warning" | "success" | "info" | string;

export interface ConfirmState<TState = unknown> {
    open: boolean;
    message: ConfirmMessage;
    cancelText: string | null;
    acceptText: string | null;
    acceptColor: ConfirmAcceptColor;
    state: TState | null;
    onAccept: ((state: TState | null) => void) | null;
}

const defaultState: ConfirmState<unknown> = {
    open: false,
    message: "",
    cancelText: null,
    acceptText: null,
    acceptColor: "error",
    state: null,
    onAccept: null,
};

export const confirmReducer = createReducer(defaultState, (builder) => {
    builder.addCase(ConfirmActions.openConfirm, (_state, action) => {
        return {
            ...defaultState,
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
