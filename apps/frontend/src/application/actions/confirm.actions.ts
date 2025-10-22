/**
 * @module confirm.actions - Defines the actions for the
 *     confirmation dialog.
 */
import type { ConfirmState } from "#application/reducers/confirm.reducer.ts";
import { createAction } from "@reduxjs/toolkit";

export class ConfirmActions {
    /**
     * Action that opens a confirm dialog.
     * @function openConfirm
     * @param {string} type - Action type.
     * @returns Action function for opening a confirm dialog.
     */
    static openConfirm =
        createAction<Pick<ConfirmState, "message" | "cancelText" | "acceptText">>("[confirm] open confirm");

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
