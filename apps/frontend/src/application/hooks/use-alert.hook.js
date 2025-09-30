/**
 * @module use-alert.hook - Custom hook for the alert
 * notifications.
 */

import { useDispatch, useSelector } from "react-redux";
import { AlertActions } from "../actions/alert.actions";
import alertSelectors from "../selectors/alert.selectors";

/**
 * Defines a hook function for the state of the alert.
 * @returns Alerthook.
 */
export const useAlert = () => {
    const dispatch = useDispatch();

    // Fetches data from the state.
    const { text, type, visible } = useSelector(alertSelectors.select);

    /**
     * Dispatches the close alert action.
     */
    const close = () => {
        dispatch(AlertActions.closeAlert());
    };

    /**
     * Dispatches the open alert error action.
     *
     * @param {string} message - Text message of the alert.
     */
    const showErrorMessage = ({ message }) => {
        dispatch(AlertActions.openErrorAlert({ text: message }));
    };

    /**
     * Dispatches the success alert action.
     *
     * @param {string} message - Text message of the alert.
     */
    const showSuccessMessage = ({ message }) => {
        dispatch(AlertActions.openSuccessAlert({ text: message }));
    };

    return {
        type,
        text,
        visible,
        close,
        showErrorMessage,
        showSuccessMessage,
    };
};
