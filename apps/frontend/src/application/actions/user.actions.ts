/**
 * @module user.actions - Defines the actions
 *     for user login.
 */
import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { LoginAPI } from "#api/login.api.ts";

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
    static setUserLoggedIn = createAction("[user] user logged in");

    /**
     * Action that sets the user as logged out.
     * @function setUserLoggedOut
     * @param {string} type - Action type.
     * @returns Action function for logging the user out.
     */
    static setUserLoggedOut = createAction("[user] user logged out");

    static getAuthStatus = createAsyncThunk("[user] get auth status", async () => {
        return await LoginAPI.getAuthenticationStatus();
    });

    static logOut = createAsyncThunk("[user] logout", async () => {
        return await LoginAPI.logOut();
    });
}
