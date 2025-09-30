/**
 * @module store - Defines the global redux store.
 */
import { configureStore } from "@reduxjs/toolkit";
import { middleware } from "./middlewares";
import { rootReducer } from "./reducers";
import { errorDefaultState } from "#application/reducers/error.reducer.ts";
import { userDefaultState } from "#application/reducers/user.reducer.ts";

/**
 * Wrapper function to create the global redux store
 * with all the reducers, initialState and middleware.
 *
 * @returns The redux store.
 */
export function createStore() {
    const errorPreload = errorDefaultState;
    const userPreload = userDefaultState;
    const navigationPreload: {
        showLanguagePicker?: boolean;
        showUniversalHeaderNavigation?: boolean;
        showProjectCatalogueInnerNavigation?: boolean;
    } = {};

    navigationPreload.showLanguagePicker = true;

    if (!window.location.pathname.includes("/login")) {
        navigationPreload.showUniversalHeaderNavigation = true;
        navigationPreload.showProjectCatalogueInnerNavigation = true;
    } else {
        navigationPreload.showUniversalHeaderNavigation = false;
    }

    return configureStore({
        reducer: rootReducer,

        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(...middleware),

        preloadedState: {
            user: userPreload,
            error: errorPreload,
            navigation: navigationPreload,
        },
    });
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof createStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
