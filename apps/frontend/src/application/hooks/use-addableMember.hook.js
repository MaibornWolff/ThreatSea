/**
 * @module use-addableMembers.hook - Custom hook
 *     for the members that can be added to a project or catalogue.
 */

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MemberActions } from "../actions/members.actions";
import { addableMemberSelectors } from "../selectors/members.selectors";

/**
 * Creates a custom overall hook for the addable members.
 * @returns Hook of the addable members.
 */
export const useAddableMembers = () => {
    const dispatch = useDispatch();

    // Items is an array of addable members and pending the flag if an api request is still going.
    const addableMembers = useSelector(addableMemberSelectors.selectAll);
    const isAddablePending = useSelector((state) => state.members.pending.isAddablePending);

    /**
     * Fetches the members when the page is loaded.
     */
    const loadAddableMembers = useCallback(
        (projectCatalogId, memberPath) => {
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
