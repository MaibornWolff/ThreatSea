/**
 * @module navigation.actions - Defines the actions
 *     for page navigation specific events and how the ui looks
 *     for certain pages.
 */
import type { NavigationState } from "#application/reducers/navigation.reducer.ts";
import { createAction } from "@reduxjs/toolkit";

/**
 * Wrapper class to expose action functions
 * for the user login.
 */
export class NavigationActions {
    /**
     * Action that sets the header of the threatsea pages accordingly.
     * @function setPageHeader
     * @param {string} type - Action type.
     * @returns Action function for setting the page header.
     */
    static setPageHeader = createAction<Required<NavigationState>>("[navigation] setting the page header");
}
