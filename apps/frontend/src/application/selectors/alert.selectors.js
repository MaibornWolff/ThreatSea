/**
 * @module alert.selectors - Defines selector functions
 *     for the alert.
 */

import { createSelector } from "reselect";

// Object with alert selector.
const alertSelectors = {
    select: createSelector([(state) => state.alert], (state) => state),
};

export default alertSelectors;
