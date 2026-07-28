import type { RootState } from "#application/store.ts";

const selectConfirmState = (state: RootState) => state.confirm;

export const confirmSelectors = {
    // Plain selector: returns the slice unchanged, so createSelector only tripped reselect's identity warning.
    select: selectConfirmState,
};
