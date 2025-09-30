/**
 * @module dialog.selectors - Defines selector functions
 *     for the fillable dialogs.
 */

import { createSelector } from "reselect";

/**
 * Wrapper object for the selector data of the fillable dialogs.
 */
const dialogsSelectors = {
    /**
     * Gets the data for the given namespace e.g assets.
     * @returns Data of the dialog for the given namespace.
     */
    selectValues: createSelector([(state, nameSpace) => state.dialogs[nameSpace]], (state) => state),
};

export default dialogsSelectors;
