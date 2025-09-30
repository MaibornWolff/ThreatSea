/**
 * @module members.adapter - Defines the adapter
 *     for the members.
 */
import { createEntityAdapter } from "@reduxjs/toolkit";

export const addedMembersAdapter = createEntityAdapter();
export const addableMembersAdapter = createEntityAdapter();
