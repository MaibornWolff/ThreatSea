/**
 * @module members.api - Defines api calls to the backend
 *     for the members.
 */
import type {
    AddMemberRequest,
    Member,
    RemoveMemberRequest,
    UpdateMemberRequest,
    User,
} from "#api/types/members.types.ts";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { fetchAPI } from "#api/utils.ts";

interface ApiUser {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
}

function buildURLEndpoint(projectCatalogId: number, memberPath: string): string {
    return `/${memberPath}/${projectCatalogId}/members`;
}

function combineFirstLastname(firstname: string, lastname: string): string {
    return `${firstname} ${lastname}`;
}

/**
 * Wrapper class for the api function of the members.
 */
export class MemberAPI {
    /**
     * Get all members of a project or catalogue.
     *
     * @param {number} projectCatalogId - id of the current project or catalogue.
     * @param {string} memberPath - Path of the endpoint for the projects or catalogues.
     * @returns Array of members.
     */
    static async getAddedMembers(projectCatalogId: number, memberPath: string): Promise<Member[]> {
        return await fetchAPI(buildURLEndpoint(projectCatalogId, memberPath), null, (res) =>
            (res as (ApiUser & { role: USER_ROLES })[]).map((m) => {
                return {
                    id: m.id,
                    name: combineFirstLastname(m.firstname, m.lastname),
                    email: m.email,
                    role: m.role,
                };
            })
        );
    }

    /**
     * Get all addable members of a project or catalogue.
     *
     * @param {number} projectCatalogId - id of the current project or catalogue.
     * @param {string} memberPath - Path of the endpoint for the projects or catalogues.
     * @returns Array of addable members.
     */
    static async getAddableMembers(projectCatalogId: number, memberPath: string): Promise<User[]> {
        return await fetchAPI(`${buildURLEndpoint(projectCatalogId, memberPath)}/addable`, null, (res) =>
            (res as ApiUser[]).map((m) => {
                return {
                    id: m.id,
                    name: combineFirstLastname(m.firstname, m.lastname),
                    email: m.email,
                };
            })
        );
    }

    /**
     * Adds a member to the specified project or catalogue.
     *
     * @param {number} projectCatalogId - id of the current project/catalogue.
     * @param {string} memberPath - Path of the endpoint for the projects or catalogues.
     * @param {string} role - Role of the selected user.
     * @param {number} id - id of the selected user.
     */
    static async addAddableMember(data: AddMemberRequest) {
        const { projectCatalogId, memberPath, id, ...body } = data;

        await fetchAPI<void>(`${buildURLEndpoint(projectCatalogId, memberPath)}/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Updates the specified member in the backend.
     *
     * @param {number} projectCatalogId - id of the current project/catalogue.
     * @param {string} memberPath - Path of the endpoint for the projects or catalogues.
     * @param {string} role - Role of the selected user.
     * @param {number} id - id of the selected user.
     */
    static async updateAddedMember(data: UpdateMemberRequest) {
        const { projectCatalogId, memberPath, id, ...body } = data;

        await fetchAPI<void>(`${buildURLEndpoint(projectCatalogId, memberPath)}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a member from the specified project or catalogue.
     *
     * @param {number} projectCatalogId - id of the current project or catalogue.
     * @param {string} memberPath - Path of the endpoint for the projects or catalogues.
     * @param {number} id - id of the member thats being deleted.
     */
    static async deleteAddedMember({ projectCatalogId, memberPath, id }: RemoveMemberRequest) {
        await fetchAPI<void>(`${buildURLEndpoint(projectCatalogId, memberPath)}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
}
