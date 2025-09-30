/**
 * @module navigation.reducer - Defines the reducer for
 *     navigation actions.
 */
import { createReducer } from "@reduxjs/toolkit";
import { NavigationActions } from "#application/actions/navigation.actions.ts";

/**
 * @type {boolean} showProjectCatalogueInnerNavigation - Indicator that the header
 *     should contain a button menu for the project view.
 * @type {boolean} showLanguagePicker - Indicator that the language
 *     picker should be shown.
 * @type {boolean} showUniversalHeaderNavigation - Indicator that the
 *     navigation to switch between catalogues and projects should be rendered.
 */
interface NavigationState {
    showProjectCatalogueInnerNavigation?: boolean;
    showLanguagePicker?: boolean;
    showUniversalHeaderNavigation?: boolean;
    showProjectInfo?: boolean;
    getCatalogInfo?: boolean;
}

/**
 * Initial state of the navigation.
 * Not used due to store preloading, so it doesn't matter how the flags are set.
 */
export const navigationDefaultState: NavigationState = {
    showProjectCatalogueInnerNavigation: false,
    showLanguagePicker: true,
    showUniversalHeaderNavigation: true,
    showProjectInfo: false,
    getCatalogInfo: false,
};

/**
 * Defines the reducer for incoming user actions.
 * @function userReducer
 */
export const navigationReducer = createReducer(navigationDefaultState, (builder) => {
    builder.addCase(NavigationActions.setPageHeader, (_state, action) => {
        return action.payload;
    });
});
