/**
 * @module alert.actions - Defines the actions for the alert
 *     notification.
 */
import { createAction } from "@reduxjs/toolkit";

/**
 * Creates the payload for an alert action.
 *
 * @param {string} text - Text that the alert displays.
 * @param {number} duration - Delay in ms after which the
 *     alert will be gone.
 * @returns Payload for the alert action.
 */
function prepareOpenAlert({ text, duration = 3000 }: { text: string; duration: number }): {
    payload: { text: string; duration: number };
} {
    return {
        payload: {
            text,
            duration,
        },
    };
}

/**
 * Class for combining the alert action functions.
 */
export class AlertActions {
    /**
     * Action for opening a successful alert.
     * @function openSuccessAlert
     * @param {string} type - Action type.
     * @param {function} prepareAction - callback function to
     *      create the payload.
     * @returns Action function for a success alert.
     */
    static openSuccessAlert = createAction("[alert] open success alert", prepareOpenAlert);

    /**
     * Action for opening an error alert.
     * @function openErrorAlert
     * @param {string} type - Action type.
     * @param {function} prepareAction - callback function to
     *      create the payload.
     * @returns Action function for a success alert.
     */
    static openErrorAlert = createAction("[alert] open error alert", prepareOpenAlert);

    /**
     * Action for setting an alert up.
     * @function setAlert
     * @param {string} type - Action type.
     * @returns Action for setting an alert.
     */
    static setAlert = createAction("[alert] set alert");

    /**
     * Action for closing an alert.
     * @function closeAlert
     * @param {string} type - Action type.
     * @returns Action for closing an alert.
     */
    static closeAlert = createAction("[alert] close alert");
}
