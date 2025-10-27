/**
 * @module use-confirm.hook - Custom hook
 *     for the confirmation dialog.
 */

import { useDispatch, useSelector } from "react-redux";
import { ConfirmActions } from "../actions/confirm.actions";
import { confirmSelectors } from "../selectors/confirm.selectors";

/**
 * Custom hook for the confirmation dialog.
 * @returns Confirmation dialog hook.
 */
export const useConfirm = () => {
    const dispatch = useDispatch();

    const { open, message, cancelText, acceptText, state, onAccept, acceptColor } = useSelector(
        confirmSelectors.select
    );

    /**
     * Cancels the dialog.
     */
    const cancelConfirm = () => {
        dispatch(ConfirmActions.cancelConfirm());
    };

    /**
     * Confirms the dialog.
     */
    const acceptConfirm = () => {
        dispatch(ConfirmActions.acceptConfirm());
        if (onAccept) {
            onAccept(state);
        }
    };

    /**
     * Opens a confirmation dialog.
     *
     * @param {string} message - Dialog message thats displayed.
     * @param {function} onAccept - Function that does something when the dialog is accepted.
     * @param {string} cancelText - Text of the cancel button.
     * @param {string} acceptText - Text of the accept button.
     * @param {string} acceptColor - Color of the accept button.
     * @param {object} state - Data thats involved in the dialog e.g deleting
     *     catalogue will have the catalogues data as the state here.
     */
    const openConfirm = ({
        message,
        onAccept,
        cancelText = "Cancel",
        acceptText = "OK",
        acceptColor = "error",
        state = null,
    }) => {
        dispatch(
            ConfirmActions.openConfirm({
                message,
                onAccept,
                cancelText,
                acceptText,
                acceptColor,
                state,
            })
        );
    };

    return {
        openConfirm,
        cancelConfirm,
        acceptConfirm,
        acceptColor,
        open,
        message,
        cancelText,
        acceptText,
    };
};
