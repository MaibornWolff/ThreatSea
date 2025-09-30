/**
 * @module members.selectors - Defines selector functions
 *     for the member adapters.
 */

import { addableMembersAdapter, addedMembersAdapter } from "../adapters/members.adapter";

const addableMemberSelectors = addableMembersAdapter.getSelectors((state) => state.members.addable);
const addedMemberSelectors = addedMembersAdapter.getSelectors((state) => state.members.added);

export { addableMemberSelectors, addedMemberSelectors };
