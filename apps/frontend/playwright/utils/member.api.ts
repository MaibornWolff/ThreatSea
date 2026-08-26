import type { APIRequestContext, APIResponse } from "@playwright/test";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { fetchApi, fetchApiRaw } from "./api.utils.ts";

export type MemberPath = "projects" | "catalogs";

export interface MemberApiUser {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
}

export type MemberApiEntry = MemberApiUser & { role: USER_ROLES };

function buildMembersEndpoint(memberPath: MemberPath, projectCatalogId: number): string {
    return `/${memberPath}/${projectCatalogId}/members`;
}

export async function getAddedMembers(
    request: APIRequestContext,
    token: string,
    memberPath: MemberPath,
    projectCatalogId: number
): Promise<MemberApiEntry[]> {
    return fetchApi(request, token, "GET", buildMembersEndpoint(memberPath, projectCatalogId));
}

export async function getAddableMembers(
    request: APIRequestContext,
    token: string,
    memberPath: MemberPath,
    projectCatalogId: number
): Promise<MemberApiUser[]> {
    return fetchApi(request, token, "GET", `${buildMembersEndpoint(memberPath, projectCatalogId)}/addable`);
}

export async function addMember(
    request: APIRequestContext,
    token: string,
    memberPath: MemberPath,
    projectCatalogId: number,
    userId: number,
    role: USER_ROLES
): Promise<void> {
    await fetchApi(request, token, "POST", `${buildMembersEndpoint(memberPath, projectCatalogId)}/${userId}`, {
        role,
    });
}

/**
 * Attempts a role update and returns the raw response instead of throwing. Used to assert on
 * the status code of a role change that is expected to be rejected (authorization negative test).
 */
export async function attemptUpdateMemberRole(
    request: APIRequestContext,
    token: string,
    memberPath: MemberPath,
    projectCatalogId: number,
    userId: number,
    role: USER_ROLES
): Promise<APIResponse> {
    return fetchApiRaw(request, token, "PUT", `${buildMembersEndpoint(memberPath, projectCatalogId)}/${userId}`, {
        role,
    });
}

/**
 * Resolves the user id of an addable candidate by email. Used to turn a fixed test profile
 * (provisioned via `provisionFixedTestUser`) into the numeric id the members API expects.
 */
export async function findAddableMemberId(
    request: APIRequestContext,
    token: string,
    memberPath: MemberPath,
    projectCatalogId: number,
    email: string
): Promise<number> {
    const addableMembers = await getAddableMembers(request, token, memberPath, projectCatalogId);
    const match = addableMembers.find((user) => user.email === email);
    if (!match) {
        throw new Error(`Expected "${email}" to be addable for ${memberPath}/${projectCatalogId}`);
    }
    return match.id;
}
