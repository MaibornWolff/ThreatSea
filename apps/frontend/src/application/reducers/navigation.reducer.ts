import { createReducer } from "@reduxjs/toolkit";
import { NavigationActions } from "#application/actions/navigation.actions.ts";

/**
 * @type {boolean} showProjectCatalogueInnerNavigation - Indicator that the header
 *     should contain a button menu for the project view.
 * @type {boolean} showUniversalHeaderNavigation - Indicator that the
 *     navigation to switch between catalogues and projects should be rendered.
 */
export interface NavigationState {
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
const defaultState: NavigationState = {
    showProjectCatalogueInnerNavigation: false,
    showLanguagePicker: true,
    showUniversalHeaderNavigation: true,
    showProjectInfo: false,
    getCatalogInfo: false,
};

export const navigationReducer = createReducer(defaultState, (builder) => {
    builder.addCase(NavigationActions.setPageHeader, (_state, action) => {
        return action.payload;
    });
});
