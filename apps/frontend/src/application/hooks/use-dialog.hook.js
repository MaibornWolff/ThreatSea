/**
 * @module use-dialog.hook - Defines the dialog
 *     custom hook.
 */

import { useDispatch, useSelector } from "react-redux";
import { DialogsActions } from "../actions/dialogs.actions";
import { dialogsSelectors } from "../selectors/dialogs.selectors";

/**
 * Creates a custom hook for the fillable dialogs.
 * @param {string} nameSpace - The type of dialog this applies to.
 * @returns Custom dialog hook.
 */
export const useDialog = (nameSpace) => {
    const dispatch = useDispatch();

    const values = useSelector((state) => dialogsSelectors.selectValues(state, nameSpace));

    /**
     * Dispatches the action to fill in the data in the
     * specified namespace state.
     * @param {object} data - Data of the filled dialog.
     */
    const confirmDialog = (data) => {
        dispatch(DialogsActions.confirmDialog(nameSpace, data));
        dispatch(DialogsActions.cancelDialog(nameSpace));
    };

    /**
     * Cancels the dialog for the given namespace.
     */
    const cancelDialog = () => {
        dispatch(DialogsActions.cancelDialog(nameSpace));
    };

    return {
        values,
        confirmDialog,
        cancelDialog,
    };
};
