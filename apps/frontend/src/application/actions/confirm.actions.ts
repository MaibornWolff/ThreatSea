/**
 * @module confirm.actions - Defines the actions for the
 *     confirmation dialog.
 */
import type { ConfirmMessage } from "#application/reducers/confirm.reducer.ts";
import { createAction, type PayloadAction } from "@reduxjs/toolkit";

interface ConfirmPayload<TState> {
    message: ConfirmMessage;
    cancelText?: string | null;
    acceptText?: string | null;
    acceptColor?: string;
    state?: TState | null;
    onAccept?: ((state: TState) => void) | null;
}

const confirmOpenBase = createAction<ConfirmPayload<unknown>>("[confirm] open confirm");

type ConfirmAction<TState> = PayloadAction<ConfirmPayload<TState>, typeof confirmOpenBase.type>;

type OpenConfirmActionCreator = typeof confirmOpenBase &
    (<TState = unknown>(payload: ConfirmPayload<TState>) => ConfirmAction<TState>);

const openConfirm = confirmOpenBase as OpenConfirmActionCreator;

export class ConfirmActions {
    /**
     * Action that opens a confirm dialog.
     * @function openConfirm
     * @param {string} type - Action type.
     * @returns Action function for opening a confirm dialog.
     */
    static openConfirm = openConfirm;

    /**
     * Action that cancels a confirm dialog.
     * @function cancelConfirm
     * @param {string} type - Action type.
     * @returns Action function for canceling a confirm dialog.
     */
    static cancelConfirm = createAction<void>("[confirm] cancel confirm");

    /**
     * Action that accepts a confirm dialog.
     * @function acceptConfirm
     * @param {string} type - Action type.
     * @returns Action function for accepting a confirm dialog.
     */
    static acceptConfirm = createAction<void>("[confirm] accept confirm");
}
