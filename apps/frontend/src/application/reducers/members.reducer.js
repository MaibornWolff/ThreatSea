/**
 * @module member.reducer - Defines the reducer for the member
 *     actions.
 */

import { createReducer } from "@reduxjs/toolkit";
import { MemberActions } from "../actions/members.actions";
import { addableMembersAdapter, addedMembersAdapter } from "../adapters/members.adapter";

/**
 * Initial state of the assets.
 *
 * @type {array of number} ids - ids of the assets.
 * @type {object of objects} entities - Holds the assets mapped to their id.
 *    Entity: @type {number} Key - id of the entity.
 *    Values:
 *         => @type {number} id - id of the asset.
 *         => @type {string} name - The name of the asset.
 *         => @type {string} description - The description of the asset.
 *         => @type {string} integrity - The integrity value of the asset.
 *         => @type {string} confidentiality - The confidentiality value of the asset.
 *         => @type {string} availability - The availability value of the asset.
 *         => @type {string} projectId - The id of the project.
 *         => @type {string} updatedAt - Timestamp when this asset got updated last.
 *         => @type {string} createdAt - Timestamp when this asset got created.
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 */
const defaultState = {
    added: addedMembersAdapter.getInitialState(),
    addable: addableMembersAdapter.getInitialState(),
    pending: {
        isAddedPending: false,
        isAddablePending: false,
    },
    isSelfRemoved: false,
    currentUserAccess: {
        userRole: -1,
        projectId: -1,
        catalogId: -1,
    },
};

const roleHandlingHelper = {
    userRole: undefined,
    isProject: false,
};

/**
 * Reducer for the assets actions.
 * @function memberReducers
 */
const membersReducer = createReducer(defaultState, (builder) => {
    builder.addCase(MemberActions.getAddedMembers.pending, (state) => {
        state.pending.isAddedPending = true;
    });

    builder.addCase(MemberActions.getAddedMembers.fulfilled, (state, action) => {
        addedMembersAdapter.setAll(state.added, action);
        state.pending.isAddedPending = false;
    });

    builder.addCase(MemberActions.getAddedMembers.rejected, (state) => {
        state.pending.isAddedPending = false;
    });

    builder.addCase(MemberActions.getAddableMembers.pending, (state) => {
        state.pending.isAddablePending = true;
    });

    builder.addCase(MemberActions.getAddableMembers.fulfilled, (state, action) => {
        addableMembersAdapter.setAll(state.addable, action);
        state.pending.isAddablePending = false;
    });

    builder.addCase(MemberActions.getAddableMembers.rejected, (state) => {
        state.pending.isAddablePending = false;
    });

    builder.addCase(MemberActions.addAddableMember.pending, (state) => {
        state.pending.isAddablePending = true;
    });

    builder.addCase(MemberActions.addAddableMember.fulfilled, (state, action) => {
        addedMembersAdapter.addOne(state.added, action.payload);
        state.pending.isAddablePending = false;
    });

    builder.addCase(MemberActions.addAddableMember.rejected, (state) => {
        state.pending.isAddablePending = false;
    });

    builder.addCase(MemberActions.updateAddedMember.pending, (state) => {
        state.pending.isAddedPending = true;
    });

    builder.addCase(MemberActions.updateAddedMember.fulfilled, (state, action) => {
        const { id, role } = action.payload;

        addedMembersAdapter.updateOne(state.added, {
            id: id,
            changes: {
                role: role,
            },
        });

        state.pending.isAddedPending = false;
    });

    builder.addCase(MemberActions.updateAddedMember.rejected, (state) => {
        state.pending.isAddedPending = false;
    });

    builder.addCase(MemberActions.deleteAddedMember.pending, (state) => {
        state.pending.isAddedPending = true;
    });

    builder.addCase(MemberActions.deleteAddedMember.fulfilled, (state, action) => {
        const { memberId, isOwnUser } = action.payload;

        addedMembersAdapter.removeOne(state.added, memberId);
        state.pending.isAddedPending = false;
        state.isSelfRemoved = isOwnUser;
    });

    builder.addCase(MemberActions.deleteAddedMember.rejected, (state) => {
        state.pending.isAddedPending = false;
    });

    builder.addCase(MemberActions.resetIsSelfRemoved, (state) => {
        state.isSelfRemoved = false;
    });
});

export { membersReducer, roleHandlingHelper };
