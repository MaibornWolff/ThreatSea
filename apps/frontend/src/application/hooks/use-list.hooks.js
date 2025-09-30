/**
 * @module use-list.hook - Custom hook
 *     to filter and sort listings.
 */

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ListActions } from "../actions/list.actions";
import listSelectors from "../selectors/list.selectors";

/**
 * Creates a hook to filter and sort listings.
 *
 * @param {string} nameSpace - Specifies the type of list.
 * @returns The list hook.
 */
export const useList = (nameSpace) => {
    const dispatch = useDispatch();
    const [searchValue, setSearchValue] = useState("");

    /**
     * Accesses the sort direction for this namespace.
     */
    const sortDirection = useSelector((state) => listSelectors.selectSortDirection(state, nameSpace));

    /**
     * Accesses the sort criteria by the given namespace.
     */
    const sortBy = useSelector((state) => listSelectors.selectSortBy(state, nameSpace));

    /**
     * Dispatches the action to sort the list.
     *
     * @param {string} sortDirection - Direction to sort the list.
     */
    const setSortDirection = (sortDirection) => {
        dispatch(ListActions.setSortDirection(nameSpace, sortDirection));
    };

    /**
     * Dispatches the action to sort the list by the search criteria.
     *
     * @param {string} sortBy - criteria to sort the list by.
     */
    const setSortBy = (sortBy) => {
        dispatch(ListActions.setSortBy(nameSpace, sortBy));
    };

    return {
        setSortDirection,
        setSortBy,
        setSearchValue,
        sortDirection,
        searchValue,
        sortBy,
    };
};
