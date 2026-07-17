/**
 * @module user.actions - Defines the actions
 *     for user login.
 */
import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { LoginAPI } from "#api/login.api.ts";
import type { UserState } from "#application/reducers/user.reducer.ts";

/**
 * The backend `/auth/status` endpoint always responds with HTTP 200 for every real auth state
 * (logged in, logged out, or an invalid/revoked token). A rejected request therefore never means
 * "logged out" — it only happens on a transient failure such as a network blip or a request
 * aborted by navigation. Retry a few times before giving up so a momentary failure on the initial
 * app mount does not eject an authenticated user to the login page.
 */
const AUTH_STATUS_RETRY_ATTEMPTS = 3;
const AUTH_STATUS_RETRY_DELAY_MS = 300;

async function fetchAuthenticationStatusWithRetry(): ReturnType<typeof LoginAPI.getAuthenticationStatus> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= AUTH_STATUS_RETRY_ATTEMPTS; attempt++) {
        try {
            return await LoginAPI.getAuthenticationStatus();
        } catch (error) {
            lastError = error;
            if (attempt < AUTH_STATUS_RETRY_ATTEMPTS) {
                await new Promise((resolve) => setTimeout(resolve, AUTH_STATUS_RETRY_DELAY_MS));
            }
        }
    }
    throw lastError;
}

/**
 * Wrapper class to expose action functions
 * for the user login.
 */
export class UserActions {
    /**
     * Action that sets the user as logged in.
     * @function setUserLoggedIn
     * @param {string} type - Action type.
     * @returns Action function for logging the user in.
     */
    static setUserLoggedIn = createAction<Omit<UserState, "isPending">>("[user] user logged in");

    /**
     * Action that sets the user as logged out.
     * @function setUserLoggedOut
     * @param {string} type - Action type.
     * @returns Action function for logging the user out.
     */
    static setUserLoggedOut = createAction<void>("[user] user logged out");

    static getAuthStatus = createAsyncThunk("[user] get auth status", async () => {
        return await fetchAuthenticationStatusWithRetry();
    });

    static logOut = createAsyncThunk("[user] logout", async () => {
        return await LoginAPI.logOut();
    });
}
