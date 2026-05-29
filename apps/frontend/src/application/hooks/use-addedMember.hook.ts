import { useCallback } from "react";
import { MemberActions } from "#application/actions/members.actions.ts";
import { addedMemberSelectors } from "#application/selectors/members.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

type DeleteMemberArgs = Parameters<typeof MemberActions.deleteAddedMember>[0];

export const useMembers = () => {
    const dispatch = useAppDispatch();

    const items = useAppSelector(addedMemberSelectors.selectAll);
    const isAddedPending = useAppSelector((state) => state.members.pending.isAddedPending);

    const loadAddedMembers = useCallback(
        (projectCatalogId: number, memberPath: string) => {
            dispatch(MemberActions.getAddedMembers({ projectCatalogId, memberPath }));
        },
        [dispatch]
    );

    const onConfirmDeleteMember = (memberState: DeleteMemberArgs) => {
        dispatch(MemberActions.deleteAddedMember(memberState));
    };

    return {
        items,
        isAddedPending,
        loadAddedMembers,
        onConfirmDeleteMember,
    };
};
