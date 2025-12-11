import { createSelector } from "reselect";
import type { RootState } from "#application/store.ts";

type ListNamespace = keyof RootState["list"];

const selectListEntry = (state: RootState, nameSpace: ListNamespace) => state.list[nameSpace];

export const listSelectors = {
    selectSortDirection: createSelector([selectListEntry], (listEntry) => listEntry.sortDirection),

    selectSortBy: createSelector([selectListEntry], (listEntry) => listEntry.sortBy),

    selectSearchValue: createSelector([selectListEntry], (listEntry) => listEntry.searchValue),
};
