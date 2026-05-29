import type { RootState } from "#application/store.ts";
import { addableMembersAdapter, addedMembersAdapter } from "#application/adapters/members.adapter.ts";

export const addableMemberSelectors = addableMembersAdapter.getSelectors((state: RootState) => state.members.addable);

export const addedMemberSelectors = addedMembersAdapter.getSelectors((state: RootState) => state.members.added);
