import { createReducer } from "@reduxjs/toolkit";
import { UserActions } from "#application/actions/user.actions.ts";

interface UserStatus {
    isLoggedIn: boolean;
}

export interface UserState {
    userId: number;
    firstname: string;
    lastname: string;
    displayName: string;
    email: string;
    status: UserStatus;
    isPending: boolean;
}

export const userDefaultState: UserState = {
    userId: -1,
    firstname: "",
    lastname: "",
    displayName: "",
    email: "",
    status: {
        isLoggedIn: false,
    },
    isPending: true,
};

export const userReducer = createReducer(userDefaultState, (builder) => {
    builder.addCase(UserActions.setUserLoggedIn, (_state, action) => {
        return {
            ...action.payload,
            isPending: false,
        };
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
