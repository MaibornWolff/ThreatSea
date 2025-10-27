import { createSelector } from "reselect";
import type { RootState } from "#application/store.ts";

const selectConfirmState = (state: RootState) => state.confirm;

export const confirmSelectors = {
    select: createSelector([selectConfirmState], (confirm) => confirm),
};
