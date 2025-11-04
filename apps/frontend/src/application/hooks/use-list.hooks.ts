import { useState } from "react";
import type { ListNamespace, SortDirection } from "../actions/list.actions.ts";
import { ListActions } from "../actions/list.actions.ts";
import { listSelectors } from "../selectors/list.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook.ts";

export const useList = (nameSpace: ListNamespace) => {
    const dispatch = useAppDispatch();
    const [searchValue, setSearchValue] = useState("");

    const sortDirection = useAppSelector((state) => listSelectors.selectSortDirection(state, nameSpace));
    const sortBy = useAppSelector((state) => listSelectors.selectSortBy(state, nameSpace));

    const setSortDirection = (direction: SortDirection) => {
        dispatch(ListActions.setSortDirection(nameSpace, direction));
    };

    const setSortBy = (sort: string) => {
        dispatch(ListActions.setSortBy(nameSpace, sort));
    };

    return {
        setSortDirection,
        setSortBy,
        setSearchValue,
        sortDirection,
        searchValue,
        sortBy,
    };
};
