import { createReducer } from "@reduxjs/toolkit";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { MemberActions } from "../actions/members.actions";
import { addableMembersAdapter, addedMembersAdapter } from "../adapters/members.adapter";

type AddedMembersState = ReturnType<typeof addedMembersAdapter.getInitialState>;
type AddableMembersState = ReturnType<typeof addableMembersAdapter.getInitialState>;

interface MembersPendingState {
    isAddedPending: boolean;
    isAddablePending: boolean;
}

interface MembersAccessState {
    userRole: USER_ROLES | undefined;
    projectId: number | undefined;
    catalogId: number | undefined;
}

export interface MembersState {
    added: AddedMembersState;
    addable: AddableMembersState;
    pending: MembersPendingState;
    isSelfRemoved: boolean;
    currentUserAccess: MembersAccessState;
}

const defaultState: MembersState = {
    added: addedMembersAdapter.getInitialState(),
    addable: addableMembersAdapter.getInitialState(),
    pending: {
        isAddedPending: false,
        isAddablePending: false,
    },
    isSelfRemoved: false,
    currentUserAccess: {
        userRole: undefined,
        projectId: undefined,
        catalogId: undefined,
    },
};

interface RoleHandlingHelper {
    userRole: USER_ROLES | undefined;
    isProject: boolean;
}

export const roleHandlingHelper: RoleHandlingHelper = {
    userRole: undefined,
    isProject: false,
};

export const membersReducer = createReducer(defaultState, (builder) => {
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
            id,
            changes: {
                role,
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
