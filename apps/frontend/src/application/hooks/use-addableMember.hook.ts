import { useCallback } from "react";
import { MemberActions } from "../actions/members.actions.ts";
import { addableMemberSelectors } from "../selectors/members.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook.ts";

export const useAddableMembers = () => {
    const dispatch = useAppDispatch();

    // Items is an array of addable members and pending the flag if an api request is still going.
    const addableMembers = useAppSelector(addableMemberSelectors.selectAll);
    const isAddablePending = useAppSelector((state) => state.members.pending.isAddablePending);

    const loadAddableMembers = useCallback(
        (projectCatalogId: number, memberPath: string) => {
            dispatch(
                MemberActions.getAddableMembers({
                    projectCatalogId,
                    memberPath,
                })
            );
        },
        [dispatch]
    );

    return {
        addableMembers,
        isAddablePending,
        loadAddableMembers,
    };
};
