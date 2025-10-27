import { createSelector } from "reselect";
import type { RootState } from "#application/store.ts";

const selectDialogByNameSpace = (state: RootState, nameSpace: string) => state.dialogs[nameSpace];

export const dialogsSelectors = {
    selectValues: createSelector([selectDialogByNameSpace], (dialog) => dialog),
};
