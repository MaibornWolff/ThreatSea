/**
 * @module members.adapter - Defines the adapter
 *     for the members.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";
import type { Member, User } from "#api/types/members.types.ts";

export const addedMembersAdapter = createEntityAdapter<Member>();
export const addableMembersAdapter = createEntityAdapter<User>();
