/**
 * @module members.actions - Defines the actions for the
 *     members.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { MemberAPI } from "#api/members.api.ts";
import type { USER_ROLES, UserRoleConfig } from "#api/types/user-roles.types.ts";

/**
 * Wrapper class that defines functions
 * for the actions of the members.
 */
export class MemberActions {
    /**
     * Action that gets the members of a project or catalogue using the backend api.
     * @function getAddedMembers
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the members.
     * @returns Action function for getting the members.
     */
    static getAddedMembers = createAsyncThunk(
        "[member] get added members",
        async ({ projectCatalogId, memberPath }: { projectCatalogId: number; memberPath: string }) => {
            return await MemberAPI.getAddedMembers(projectCatalogId, memberPath);
        }
    );

    /**
     * Action that gets the members that can be added to this project or catalogue.
     * @function getAddableMembers
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the addable members.
     * @returns Action function for getting the addable members.
     */
    static getAddableMembers = createAsyncThunk(
        "[member] get addable members",
        async ({ projectCatalogId, memberPath }: { projectCatalogId: number; memberPath: string }) => {
            return await MemberAPI.getAddableMembers(projectCatalogId, memberPath);
        }
    );

    /**
     * Action that adds a new member.
     * @function addAddableMember
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to add a member.
     * @returns Action function for adding a member.
     */
    static addAddableMember = createAsyncThunk(
        "[member] add an addable member",
        async (data: {
            id: number;
            name: string;
            email: string;
            projectCatalogId: number;
            memberPath: string;
            role: USER_ROLES;
        }) => {
            await MemberAPI.addAddableMember(data);
            return {
                role: data.role,
                id: data.id,
                name: data.name,
                email: data.email,
            };
        }
    );

    /**
     * Action that updates a member using the backend api.
     * @function updateAddedMember
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update a member.
     * @returns Action function for updating a member.
     */
    static updateAddedMember = createAsyncThunk(
        "[member] update member",
        async (data: {
            id: number;
            name: string;
            projectCatalogId: number;
            memberPath: string;
            role: USER_ROLES;
            roleConfig: UserRoleConfig;
        }) => {
            await MemberAPI.updateAddedMember(data);
            return {
                role: data.role,
                id: data.id,
                name: data.name,
                projectCatalogId: data.projectCatalogId,
                roleConfig: data.roleConfig,
            };
        }
    );

    /**
     * Action that deletes a member using the backend api.
     * @function deleteAddedMember
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to delete a member.
     * @returns Action function for deleting a member.
     */
    static deleteAddedMember = createAsyncThunk(
        "[member] delete member",
        async (data: {
            memberId: number;
            ownUserId: number;
            name: string;
            projectCatalogId: number;
            memberPath: string;
        }) => {
            await MemberAPI.deleteAddedMember({
                id: data.memberId,
                projectCatalogId: data.projectCatalogId,
                memberPath: data.memberPath,
            });
            return {
                memberId: data.memberId,
                isOwnUser: data.memberId === data.ownUserId,
                name: data.name,
            };
        }
    );

    /**
     * Action that changes the flag if a user
     * removed himself.
     * @function resetIsSelfRemoved
     * @param {string} type - Action type.
     * @returns Action function for resetting the isSelfRemoved flag.
     */
    static resetIsSelfRemoved = createAction<void>("[member] reset isSelfRemoved flag");

    /**
     * Action that checks and changes the role of the user
     * if it has been changed server sided.
     *
     * @function errorChangedSelfRole
     * @param {string} type - Action type.
     * @returns Action for changing the own user role.
     */
    static errorChangeSelfRole = createAction<unknown>("[member] error change own role");

    /**
     * Refreshes the user access role to hide ui elements that
     * need higher privilige.
     *
     * @function refreshSelfRole
     * @param {string} type - Action type.
     * @returns Action for refreshing the role of the own user.
     */
    static refreshSelfRole = createAction<unknown>("[member] changing members role");
}
