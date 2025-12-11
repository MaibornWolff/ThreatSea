/**
 * @module store - Defines the global redux store.
 */
import { configureStore } from "@reduxjs/toolkit";
import { middleware } from "./middlewares";
import { rootReducer } from "./reducers";
import { errorDefaultState } from "#application/reducers/error.reducer.ts";
import { userDefaultState } from "#application/reducers/user.reducer.ts";
import type { NavigationState } from "#application/reducers/navigation.reducer.ts";
import type { RootState } from "./store.types";

/**
 * Wrapper function to create the global redux store
 * with all the reducers, initialState and middleware.
 *
 * @returns The redux store.
 */
export function createStore(preloadedState?: Partial<RootState>) {
    const errorPreload = errorDefaultState;
    const userPreload = userDefaultState;
    const navigationPreload: NavigationState = {
        showLanguagePicker: true,
    };

    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
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
            ...preloadedState,
        },
    });
}

export type AppStore = ReturnType<typeof createStore>;
export type { RootState, AppDispatch } from "./store.types";
