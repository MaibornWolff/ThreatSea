/**
 * @module purge-inactive-users.job - Hard-deletes users whose last login is
 *     older than the purge threshold, unless they are the sole owner of a
 *     project or catalog.
 */
import { and, eq, inArray, lte, ne, notExists, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { userLifecycleConfig } from "#config/config.js";
import { db } from "#db/index.js";
import { users, usersCatalogs, usersProjects } from "#db/schema.js";
import { Logger } from "#logging/index.js";
import { USER_ROLES } from "#types/user-roles.types.js";

export async function purgeInactiveUsers(
    purgeThresholdDays: number = userLifecycleConfig.purgeThresholdDays
): Promise<void> {
    const purgeCutoff = () => sql`now() - (${purgeThresholdDays} * interval '1 day')`;

    const purgeCandidates = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(lte(users.lastLoginAt, purgeCutoff()));

    if (purgeCandidates.length === 0) {
        Logger.info("purgeInactiveUsers: deleted 0 users, skipped 0 sole owners");
        return;
    }

    const candidateIds = purgeCandidates.map((candidate) => candidate.id);
    const candidateEmailById = new Map(purgeCandidates.map((candidate) => [candidate.id, candidate.email]));

    const otherProjectOwner = alias(usersProjects, "other_project_owner");
    const soleOwnedProjects = await db
        .select({ userId: usersProjects.userId, projectId: usersProjects.projectId })
        .from(usersProjects)
        .where(
            and(
                inArray(usersProjects.userId, candidateIds),
                eq(usersProjects.role, USER_ROLES.OWNER),
                notExists(
                    db
                        .select({ ownerExists: sql`1` })
                        .from(otherProjectOwner)
                        .where(
                            and(
                                eq(otherProjectOwner.projectId, usersProjects.projectId),
                                eq(otherProjectOwner.role, USER_ROLES.OWNER),
                                ne(otherProjectOwner.userId, usersProjects.userId)
                            )
                        )
                )
            )
        );

    const otherCatalogOwner = alias(usersCatalogs, "other_catalog_owner");
    const soleOwnedCatalogs = await db
        .select({ userId: usersCatalogs.userId, catalogId: usersCatalogs.catalogId })
        .from(usersCatalogs)
        .where(
            and(
                inArray(usersCatalogs.userId, candidateIds),
                eq(usersCatalogs.role, USER_ROLES.OWNER),
                notExists(
                    db
                        .select({ ownerExists: sql`1` })
                        .from(otherCatalogOwner)
                        .where(
                            and(
                                eq(otherCatalogOwner.catalogId, usersCatalogs.catalogId),
                                eq(otherCatalogOwner.role, USER_ROLES.OWNER),
                                ne(otherCatalogOwner.userId, usersCatalogs.userId)
                            )
                        )
                )
            )
        );

    for (const soleOwnership of soleOwnedProjects) {
        Logger.warning(
            `purgeInactiveUsers: skipping user ${candidateEmailById.get(soleOwnership.userId)} (id=${soleOwnership.userId}), sole owner of project ${soleOwnership.projectId}`
        );
    }
    for (const soleOwnership of soleOwnedCatalogs) {
        Logger.warning(
            `purgeInactiveUsers: skipping user ${candidateEmailById.get(soleOwnership.userId)} (id=${soleOwnership.userId}), sole owner of catalog ${soleOwnership.catalogId}`
        );
    }

    const blockedUserIds = new Set([
        ...soleOwnedProjects.map((soleOwnership) => soleOwnership.userId),
        ...soleOwnedCatalogs.map((soleOwnership) => soleOwnership.userId),
    ]);
    const deletableUserIds = candidateIds.filter((candidateId) => !blockedUserIds.has(candidateId));

    let deletedCount = 0;
    if (deletableUserIds.length > 0) {
        // Re-check the cutoff so a login between candidate selection and deletion is respected.
        const deletedUsers = await db
            .delete(users)
            .where(and(inArray(users.id, deletableUserIds), lte(users.lastLoginAt, purgeCutoff())))
            .returning({ id: users.id });
        deletedCount = deletedUsers.length;
    }

    Logger.info(`purgeInactiveUsers: deleted ${deletedCount} users, skipped ${blockedUserIds.size} sole owners`);
}
