/**
 * @module list.actions - Defines the actions for
 *     for filtering/sorting lists e.g the threat view.
 */
import { createAction } from "@reduxjs/toolkit";

/**
 * Wrapper class for defining functions
 * to expose the list actions.
 */
export class ListActions {
    /**
     * Action that sets the sorting direction for a given list => asc/desc.
     * @function setSortDirection
     * @param {string} type - Action type.
     * @param {function} prepareAction - callback function to
     *     create the payload => sortDirection is asc/desc as a string and nameSpace a string
     *     defining the list type.
     * @returns Action function for setting the sort direction for a given list.
     */
    static setSortDirection = createAction(
        "[list] set Sort Direction",
        (
            nameSpace:
                | "projects"
                | "assets"
                | "catalogs"
                | "catalogThreats"
                | "catalogMeasures"
                | "threats"
                | "measures"
                | "measureThreats"
                | "threatMeasures"
                | "addedMembers"
                | "addableMembers",
            sortDirection: "asc" | "desc"
        ) => ({
            payload: { nameSpace, sortDirection },
        })
    );

    /**
     * Action that sets the type we sort for.
     * @function setSortBy
     * @param {string} type - Action type.
     * @param {function} prepareAction - callback function to
     *     create the payload => sortBy is a string that is the attribute we sort by
     *     and nameSpace a string defining the list type.
     * @returns Action function for setting the type thats sorted by.
     */
    static setSortBy = createAction(
        "[list] set Sort By",
        (
            nameSpace:
                | "projects"
                | "assets"
                | "catalogs"
                | "catalogThreats"
                | "catalogMeasures"
                | "threats"
                | "measures"
                | "measureThreats"
                | "threatMeasures"
                | "addedMembers"
                | "addableMembers",
            sortBy: string
        ) => ({
            payload: { nameSpace, sortBy },
        })
    );

    /**
     * Action that sets the search value for filtering.
     * @function setSearchValue
     * @param {string} type - Action type.
     * @param {function} prepareAction - callback function to
     *     create the payload => searchValue is the value we filter for
     *     and nameSpace a string defining the list type.
     * @returns Action function for setting the search value for filtering.
     */
    static setSearchValue = createAction(
        "[list] set Search Value",
        (
            nameSpace:
                | "projects"
                | "assets"
                | "catalogs"
                | "catalogThreats"
                | "catalogMeasures"
                | "threats"
                | "measures"
                | "measureThreats"
                | "threatMeasures"
                | "addedMembers"
                | "addableMembers",
            searchValue: string
        ) => ({
            payload: {
                nameSpace,
                searchValue,
            },
        })
    );
}
