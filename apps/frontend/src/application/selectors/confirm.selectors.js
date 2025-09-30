/**
 * @module confirm.selectors - Defines selector functions
 *     for the confirm dialogs.
 */

import { createSelector } from "reselect";

/**
 * Selector for confirmation wrapped with an object.
 */
const confirmSelectors = {
    select: createSelector([(state) => state.confirm], (state) => state),
};

export default confirmSelectors;
