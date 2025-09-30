/**
 * @module list.selectors - Defines
 *     selectors for lists.
 */

import { createSelector } from "reselect";

/**
 * Wrapper object for the list selectors.
 */
const listSelectors = {
    /**
     * Gets the sort direction for the specified namespace.
     * @returns The sorting direction.
     */
    selectSortDirection: createSelector([(state, nameSpace) => state.list[nameSpace].sortDirection], (state) => state),

    /**
     * Gets the sortdirection for the specified namespace.
     * @returns The attribute to sort by.
     */
    selectSortBy: createSelector([(state, nameSpace) => state.list[nameSpace].sortBy], (state) => state),

    /**
     * Gets the searchvalue for the specified namespace.
     * @returns The searchvalue for filtering lists.
     */
    selectSearchValue: createSelector([(state, nameSpace) => state.list[nameSpace].searchValue], (state) => state),
};

export default listSelectors;
