import type { RootState } from "#application/store.ts";

const selectConfirmState = (state: RootState) => state.confirm;

export const confirmSelectors = {
    // Plain selector: it returns the confirm slice unchanged, so wrapping it in createSelector added
    // no memoization and tripped reselect's identity-function warning.
    select: selectConfirmState,
};
