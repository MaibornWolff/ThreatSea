import { createSelector } from "reselect";
import type { RootState } from "#application/store.ts";

const selectAlertState = (state: RootState) => state.alert;

export const alertSelectors = {
    select: createSelector([selectAlertState], (alert) => alert),
};
