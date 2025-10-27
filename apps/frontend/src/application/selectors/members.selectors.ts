import type { RootState } from "#application/store.ts";
import { addableMembersAdapter, addedMembersAdapter } from "../adapters/members.adapter";

export const addableMemberSelectors = addableMembersAdapter.getSelectors((state: RootState) => state.members.addable);

export const addedMemberSelectors = addedMembersAdapter.getSelectors((state: RootState) => state.members.added);
