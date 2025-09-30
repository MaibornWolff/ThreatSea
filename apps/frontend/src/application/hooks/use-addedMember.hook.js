/**
 * @module use-addedMembers.hook - Custom hook
 *     for the members.
 */

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MemberActions } from "../actions/members.actions";
import { addedMemberSelectors } from "../selectors/members.selectors";

/**
 * Creates a custom overall hook for the members.
 * @returns Hook of the members.
 */
export const useMembers = () => {
    const dispatch = useDispatch();

    // Items is an array of members and pending the flag if an api request is still going.
    const items = useSelector(addedMemberSelectors.selectAll);
    const isAddedPending = useSelector((state) => state.members.pending.isAddedPending);

    /**
     * Fetches the members when the page is loaded.
     */
    const loadAddedMembers = useCallback(
        (projectCatalogId, memberPath) => {
            dispatch(MemberActions.getAddedMembers({ projectCatalogId, memberPath }));
        },
        [dispatch]
    );

    /**
     * Eventhandler that deletes the selected member when
     * the confirmation dialog has been confirmed.
     *
     * @param {object} memberState - Holds the id of the member and
     *     the id of the project.
     */
    const onConfirmDeleteMember = (memberState) => {
        dispatch(MemberActions.deleteAddedMember(memberState));
    };

    return {
        items,
        isAddedPending,
        loadAddedMembers,
        onConfirmDeleteMember,
    };
};
