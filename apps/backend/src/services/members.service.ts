/**
 * @module members.service - Defines services for the controlling
 *     functions of the members
 */
import { and, eq, getTableColumns, isNull, not } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { projects, User, users, usersCatalogs, usersProjects } from "#db/schema.js";
import { checkRole } from "#guards/authorisation.guard.js";
import { USER_ROLES } from "#types/user-roles.types.js";

export type UserWithRole = User & { role: USER_ROLES };

/**
 * Gets all members of a given project.
 *
 * @param {number} projectId - The id of the project
 * @return {Promise<UserWithRole[]>} A promise that resolves to an array of users with their roles in the project.
 */
export async function getProjectAddedMembers(projectId: number): Promise<UserWithRole[]> {
    return await db
        .select({ ...getTableColumns(users), role: usersProjects.role })
        .from(users)
        .innerJoin(usersProjects, eq(users.id, usersProjects.userId))
        .where(eq(usersProjects.projectId, projectId));
}

/**
 * Gets all members of a given catalog.
 *
 * @param {number} catalogId - The id of the catalog
 * @return {Promise<UserWithRole[]>} A promise that resolves to an array of users with their roles in the catalog.
 */
export async function getCatalogAddedMembers(catalogId: number): Promise<UserWithRole[]> {
    return await db
        .select({ ...getTableColumns(users), role: usersCatalogs.role })
        .from(users)
        .innerJoin(usersCatalogs, eq(users.id, usersCatalogs.userId))
        .where(eq(usersCatalogs.catalogId, catalogId));
}

/**
 * Gets all users that can be added to this project.
 *
 * @param {number} projectId - The id of the project.
 * @return {Promise<User[]>} A promise that resolves to an array of users that can be added to the project.
 */
export async function getProjectAddableMembers(projectId: number): Promise<User[]> {
    return await db
        .select({ ...getTableColumns(users) })
        .from(users)
        .leftJoin(usersProjects, and(eq(users.id, usersProjects.userId), eq(usersProjects.projectId, projectId)))
        .where(isNull(usersProjects.userId));
}

/**
 * Gets all users that can be added to this catalog.
 *
 * @param {number} catalogId - The id of the catalog.
 * @return {Promise<User[]>} A promise that resolves to an array of users that can be added to the catalog.
 */
export async function getCatalogAddableMembers(catalogId: number): Promise<User[]> {
    return await db
        .select({ ...getTableColumns(users) })
        .from(users)
        .leftJoin(usersCatalogs, and(eq(users.id, usersCatalogs.userId), eq(usersCatalogs.catalogId, catalogId)))
        .where(isNull(usersCatalogs.userId));
}

/**
 * Checks if a user is a member of the project.
 * @param {number} projectId - The id of the project.
 * @param {number} userId - The id of the user.
 * @returns {Promise<boolean>} A promise that resolves to true if the user is a member, false otherwise.
 */
export async function isProjectMember(projectId: number, userId: number): Promise<boolean> {
    return (
        (await db.query.usersProjects.findFirst({
            where: and(eq(usersProjects.projectId, projectId), eq(usersProjects.userId, userId)),
        })) !== undefined
    );
}

/**
 * Checks if a user is a member of the catalog.
 * @param {number} catalogId - The id of the catalog.
 * @param {number} userId - The id of the user.
 * @returns {Promise<boolean>} A promise that resolves to true if the user is a member, false otherwise.
 */
export async function isCatalogMember(catalogId: number, userId: number): Promise<boolean> {
    return (
        (await db.query.usersCatalogs.findFirst({
            where: and(eq(usersCatalogs.catalogId, catalogId), eq(usersCatalogs.userId, userId)),
        })) !== undefined
    );
}

/**
 * Adds a member to a catalog.
 *
 * @param catalogId - The id of the catalog.
 * @param userId - The id of the user.
 * @param role - The role of the user.
 * @returns {Promise<void>} A promise that resolves when the member has been added.
 */
export async function addCatalogAddableMember(catalogId: number, userId: number, role: USER_ROLES): Promise<void> {
    await db.insert(usersCatalogs).values({ catalogId: catalogId, userId: userId, role: role });
}

/**
 * Adds a member to a project.
 *
 * @param projectId - The id of the project.
 * @param userId - The id of the user.
 * @param role - The role of the user.
 * @returns {Promise<void>} A promise that resolves when the member has been added.
 */
export async function addProjectAddableMember(projectId: number, userId: number, role: USER_ROLES): Promise<void> {
    await db.transaction(async (tx) => {
        await tx.insert(usersProjects).values({ projectId: projectId, userId: userId, role: role });
        await addMemberAsCatalogViewer(projectId, userId, role, tx);
    });
}

/**
 * Changes the role of a member in the specified catalog.
 *
 * @param catalogId - The id of the catalog.
 * @param userId - The id of the user.
 * @param role - The new role of the user.
 * @return {Promise<void>} A promise that resolves when the role has been updated.
 * @throws {Error} If the catalog would be left without an owner.
 */
export async function updateCatalogAddedMember(catalogId: number, userId: number, role: USER_ROLES): Promise<void> {
    const otherOwner = await db.query.usersCatalogs.findFirst({
        where: and(
            and(not(eq(usersCatalogs.userId, userId)), eq(usersCatalogs.role, USER_ROLES.OWNER)),
            eq(usersCatalogs.catalogId, catalogId)
        ),
    });

    // Check that this catalog has another owner.
    if (!otherOwner) {
        throw new Error("Cannot change role of user, this would leave the catalog without an owner.");
    }

    await db
        .update(usersCatalogs)
        .set({ role: role })
        .where(and(eq(usersCatalogs.catalogId, catalogId), eq(usersCatalogs.userId, userId)));
}

/**
 * Updates the role of a member in the specified project.
 *
 * @param projectId - The id of the project.
 * @param userId - The id of the user.
 * @param role - The new role of the user.
 * @return {Promise<void>} A promise that resolves when the role has been updated.
 * @throws {Error} If the project would be left without an owner.
 */
export async function updateProjectAddedMember(projectId: number, userId: number, role: USER_ROLES): Promise<void> {
    const otherOwner = await db.query.usersProjects.findFirst({
        where: and(
            and(not(eq(usersProjects.userId, userId)), eq(usersProjects.role, USER_ROLES.OWNER)),
            eq(usersProjects.projectId, projectId)
        ),
    });

    // Check that this project has another owner.
    if (!otherOwner) {
        throw new Error("Cannot change role of user, this would leave the project without an owner.");
    }

    await db.transaction(async (tx) => {
        await tx
            .update(usersProjects)
            .set({ role: role })
            .where(and(eq(usersProjects.projectId, projectId), eq(usersProjects.userId, userId)));
        await addMemberAsCatalogViewer(projectId, userId, role, tx);
    });
}

/**
 * Adds a user to the underlying catalog of a project as a viewer when the role
 * received is editor or higher and if the user isn't already inside the catalog.
 *
 * @param {number} projectId - The id of the project.
 * @param {number} userId - The id of the member.
 * @param {USER_ROLES} role - The role of the member.
 * @param {TransactionType} tx - drizzle transaction.
 * @returns {Promise<void>} A promise that resolves when the member has been added as a catalog viewer.
 */
async function addMemberAsCatalogViewer(
    projectId: number,
    userId: number,
    role: USER_ROLES,
    tx: TransactionType
): Promise<void> {
    if (!checkRole(role, USER_ROLES.EDITOR)) {
        return;
    }

    // Get the underlying catalog of the project.
    const catalogId = (await tx.query.projects.findFirst({ where: eq(projects.id, projectId) }))?.catalogId;

    if (catalogId === undefined) {
        return;
    }

    await tx
        .insert(usersCatalogs)
        .values({ catalogId: catalogId, userId: userId, role: USER_ROLES.VIEWER })
        .onConflictDoNothing({ target: [usersCatalogs.catalogId, usersCatalogs.userId] });
}

/**
 * Deletes a member of a catalog if the member is not the only owner left.
 *
 * @param {number} catalogId - The id of the catalog.
 * @param {number} userId - The id of the member.
 * @return {Promise<void>} A promise that resolves when the member has been removed.
 * @throws {Error} If the catalog would be left without an owner.
 */
export async function removeCatalogMember(catalogId: number, userId: number): Promise<void> {
    const otherOwner = await db.query.usersCatalogs.findFirst({
        where: and(
            and(not(eq(usersCatalogs.userId, userId)), eq(usersCatalogs.role, USER_ROLES.OWNER)),
            eq(usersCatalogs.catalogId, catalogId)
        ),
    });

    // Check that this catalog has another owner.
    if (otherOwner === undefined || otherOwner === null) {
        throw new Error("Cannot delete user, this would leave the catalog without an owner.");
    }

    await db.delete(usersCatalogs).where(and(eq(usersCatalogs.userId, userId), eq(usersCatalogs.catalogId, catalogId)));
}

/**
 * Deletes a member of a project if the member is not the only owner left.
 *
 * @param {number} projectId - The id of the project.
 * @param {number} userId - The id of the member.
 * @return {Promise<void>} A promise that resolves when the member has been removed.
 * @throws {Error} If the project would be left without an owner.
 */
export async function removeProjectMember(projectId: number, userId: number): Promise<void> {
    const otherOwner = await db.query.usersProjects.findFirst({
        where: and(
            and(not(eq(usersProjects.userId, userId)), eq(usersProjects.role, USER_ROLES.OWNER)),
            eq(usersProjects.projectId, projectId)
        ),
    });

    // Check that this project has another owner.
    if (otherOwner === undefined || otherOwner === null) {
        throw new Error("Cannot delete user, this would leave the project without an owner.");
    }

    await db.delete(usersProjects).where(and(eq(usersProjects.userId, userId), eq(usersProjects.projectId, projectId)));
}
