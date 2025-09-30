/**
 * @module dialogs.actions - Defines the actions for
 *     fillable dialogs.
 */
import { createAction } from "@reduxjs/toolkit";

/**
 * Wrapper class to define functions for
 * the dialog actions.
 */
export class DialogsActions {
    /**
     * Action that opens/sets a fillable dialog.
     * @function setValue
     * @param {string} type - Action type.
     * @param {function} prepareAction - callback function to
     *     create the payload => Data is the data of the dialog and nameSpace a string
     *     defining the dialog type.
     * @returns Action function for opening/setting a fillable dialog.
     */
    static setValue = createAction("[dialogs] set value", (nameSpace: string, data) => {
        return {
            payload: {
                nameSpace,
                data,
            },
        };
    });

    static setError = createAction("[dialogs] set error", (nameSpace: string, error) => {
        return {
            payload: {
                nameSpace,
                error,
            },
        };
    });

    /**
     * Action that confirms a fillable dialog.
     * @function confirmDialog
     * @param {string} type - Action type.
     * @param {function} prepareAction - callback function to
     *     create the payload => Data is the data of the dialog and nameSpace a string
     *     defining the dialog type.
     * @returns Action function for confirming a fillable dialog.
     */
    static confirmDialog = createAction("[dialogs] confirm dialog", (nameSpace: string, data) => {
        return {
            payload: {
                nameSpace,
                data,
            },
        };
    });

    /**
     * Action that cancels a fillable dialog.
     * @function cancelDialog
     * @param {string} type - Action type.
     * @param {function} prepareAction - callback function to
     *     create the payload => nameSpace is a string
     *     defining the dialog type.
     * @returns Action function for canceling a fillable dialog.
     */
    static cancelDialog = createAction("[dialogs] cancel dialog", (nameSpace: string) => {
        return {
            payload: {
                nameSpace,
            },
        };
    });
}
