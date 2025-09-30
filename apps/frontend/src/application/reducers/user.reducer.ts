/**
 * @module user.reducer - Defines the reducer for
 *     the user login.
 */
import { createReducer } from "@reduxjs/toolkit";
import { UserActions } from "#application/actions/user.actions.ts";

interface UserStatus {
    isLoggedIn: boolean;
    isPrivileged: boolean;
}

interface UserState {
    userId: number;
    firstname: string;
    lastname: string;
    email: string;
    status: UserStatus;
    isPending: boolean;
}

/**
 * Initial state of the user.
 *
 * @type {number} userId - id of the current user.
 * @type {string} firstname - The firstname of the user.
 * @type {string} lastname - The lastname of the user.
 * @type {string} email - The email of the user.
 */
export const userDefaultState: UserState = {
    userId: -1,
    firstname: "",
    lastname: "",
    email: "",
    status: {
        isLoggedIn: false,
        isPrivileged: false,
    },
    isPending: true,
};

/**
 * Defines the reducer for incoming user actions.
 * @function userReducer
 */
export const userReducer = createReducer(userDefaultState, (builder) => {
    builder.addCase(UserActions.setUserLoggedIn, (_state, action) => {
        return action.payload;
    });

    builder.addCase(UserActions.setUserLoggedOut, () => {
        return {
            ...userDefaultState,
            isPending: false,
        };
    });

    builder.addCase(UserActions.getAuthStatus.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(UserActions.getAuthStatus.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(UserActions.getAuthStatus.fulfilled, (state, action) => {
        return {
            ...state,
            ...action.payload,
            isPending: false,
        };
    });
});
