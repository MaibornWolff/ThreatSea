/**
 * @module purge-inactive-users.job - Hard-deletes users whose last login is
 *     older than the purge threshold, unless they are the sole owner of a
 *     project or catalog.
 */
import { and, eq, gt, lte, ne, notExists, SQL, sql } from "drizzle-orm";
import { alias, PgColumn } from "drizzle-orm/pg-core";
import { userLifecycleConfig } from "#config/config.js";
import { db } from "#db/index.js";
import { users, usersCatalogs, usersProjects } from "#db/schema.js";
import { Logger } from "#logging/index.js";
import { USER_ROLES } from "#types/user-roles.types.js";

type OwnershipAlias =
    | ReturnType<typeof alias<typeof usersProjects, string>>
    | ReturnType<typeof alias<typeof usersCatalogs, string>>;
type UsersAlias = ReturnType<typeof alias<typeof users, string>>;

/**
 * Builds a `notExists` predicate that holds when the given ownership row has no OTHER
 * owner of the same entity who survives this purge (i.e. logged in more recently than
 * the cutoff). One helper collapses the project/catalog × select/delete variants so
 * the "would this leave the entity ownerless" rule stays provably identical everywhere.
 */
function noOtherSurvivingOwner(
    survivingOwnership: OwnershipAlias,
    survivingOwner: UsersAlias,
    entityMatches: SQL,
    ownerUserId: PgColumn,
    purgeCutoff: SQL
): SQL {
    return notExists(
        db
            .select({ survivingOwnerExists: sql`1` })
            .from(survivingOwnership)
            .innerJoin(survivingOwner, eq(survivingOwner.id, survivingOwnership.userId))
            .where(
                and(
                    entityMatches,
                    eq(survivingOwnership.role, USER_ROLES.OWNER),
                    ne(survivingOwnership.userId, ownerUserId),
                    gt(survivingOwner.lastLoginAt, purgeCutoff)
                )
            )
    );
}

export async function purgeInactiveUsers(
    purgeThresholdDays: number = userLifecycleConfig.purgeThresholdDays
): Promise<void> {
    const purgeCutoff = (): SQL => sql`now() - (${purgeThresholdDays} * interval '1 day')`;

    // Sole owners that will be kept back are only queried for observability; the DELETE
    // below re-derives the same protection independently from committed state.
    const soleProjectOwner = alias(usersProjects, "sole_project_owner");
    const soleProjectOwnerUser = alias(users, "sole_project_owner_user");
    const soleOwnedProjects = await db
        .select({ userId: usersProjects.userId, projectId: usersProjects.projectId })
        .from(usersProjects)
        .innerJoin(users, eq(users.id, usersProjects.userId))
        .where(
            and(
                eq(usersProjects.role, USER_ROLES.OWNER),
                lte(users.lastLoginAt, purgeCutoff()),
                noOtherSurvivingOwner(
                    soleProjectOwner,
                    soleProjectOwnerUser,
                    eq(soleProjectOwner.projectId, usersProjects.projectId),
                    usersProjects.userId,
                    purgeCutoff()
                )
            )
        );

    const soleCatalogOwner = alias(usersCatalogs, "sole_catalog_owner");
    const soleCatalogOwnerUser = alias(users, "sole_catalog_owner_user");
    const soleOwnedCatalogs = await db
        .select({ userId: usersCatalogs.userId, catalogId: usersCatalogs.catalogId })
        .from(usersCatalogs)
        .innerJoin(users, eq(users.id, usersCatalogs.userId))
        .where(
            and(
                eq(usersCatalogs.role, USER_ROLES.OWNER),
                lte(users.lastLoginAt, purgeCutoff()),
                noOtherSurvivingOwner(
                    soleCatalogOwner,
                    soleCatalogOwnerUser,
                    eq(soleCatalogOwner.catalogId, usersCatalogs.catalogId),
                    usersCatalogs.userId,
                    purgeCutoff()
                )
            )
        );

    for (const soleOwnership of soleOwnedProjects) {
        Logger.warning(
            `purgeInactiveUsers: skipping user id=${soleOwnership.userId}, sole owner of project ${soleOwnership.projectId}`
        );
    }
    for (const soleOwnership of soleOwnedCatalogs) {
        Logger.warning(
            `purgeInactiveUsers: skipping user id=${soleOwnership.userId}, sole owner of catalog ${soleOwnership.catalogId}`
        );
    }

    const skippedSoleOwnerIds = new Set([
        ...soleOwnedProjects.map((soleOwnership) => soleOwnership.userId),
        ...soleOwnedCatalogs.map((soleOwnership) => soleOwnership.userId),
    ]);

    // Delete every user past the cutoff who is not the last surviving owner of any project
    // or catalog. Last-login and ownership are re-evaluated here, so a login or ownership
    // change since the queries above is still respected. Users are matched by predicate
    // rather than a bound ID array, so the statement stays within Postgres's parameter
    // limit no matter how many users are inactive.
    const projectOwnership = alias(usersProjects, "project_ownership");
    const deleteProjectSurvivor = alias(usersProjects, "delete_project_survivor");
    const deleteProjectSurvivorUser = alias(users, "delete_project_survivor_user");
    const catalogOwnership = alias(usersCatalogs, "catalog_ownership");
    const deleteCatalogSurvivor = alias(usersCatalogs, "delete_catalog_survivor");
    const deleteCatalogSurvivorUser = alias(users, "delete_catalog_survivor_user");

    const deletedUsers = await db
        .delete(users)
        .where(
            and(
                lte(users.lastLoginAt, purgeCutoff()),
                notExists(
                    db
                        .select({ ownershipExists: sql`1` })
                        .from(projectOwnership)
                        .where(
                            and(
                                eq(projectOwnership.userId, users.id),
                                eq(projectOwnership.role, USER_ROLES.OWNER),
                                noOtherSurvivingOwner(
                                    deleteProjectSurvivor,
                                    deleteProjectSurvivorUser,
                                    eq(deleteProjectSurvivor.projectId, projectOwnership.projectId),
                                    projectOwnership.userId,
                                    purgeCutoff()
                                )
                            )
                        )
                ),
                notExists(
                    db
                        .select({ ownershipExists: sql`1` })
                        .from(catalogOwnership)
                        .where(
                            and(
                                eq(catalogOwnership.userId, users.id),
                                eq(catalogOwnership.role, USER_ROLES.OWNER),
                                noOtherSurvivingOwner(
                                    deleteCatalogSurvivor,
                                    deleteCatalogSurvivorUser,
                                    eq(deleteCatalogSurvivor.catalogId, catalogOwnership.catalogId),
                                    catalogOwnership.userId,
                                    purgeCutoff()
                                )
                            )
                        )
                )
            )
        )
        .returning({ id: users.id });

    Logger.info(
        `purgeInactiveUsers: deleted ${deletedUsers.length} users, skipped ${skippedSoleOwnerIds.size} sole owners`
    );
}

let purgeIntervalHandle: NodeJS.Timeout | undefined;

export function startInactiveUserPurgeScheduler(
    lifecycleConfig: typeof userLifecycleConfig = userLifecycleConfig
): Promise<void> {
    if (purgeIntervalHandle !== undefined) {
        Logger.warning("purgeInactiveUsers: scheduler already running; ignoring duplicate start");
        return Promise.resolve();
    }
    if (!lifecycleConfig.purgeEnabled) {
        Logger.info("purgeInactiveUsers: scheduler disabled via USER_PURGE_ENABLED");
        return Promise.resolve();
    }
    if (lifecycleConfig.hideThresholdDays >= lifecycleConfig.purgeThresholdDays) {
        Logger.error(
            `purgeInactiveUsers: invalid configuration, USER_HIDE_THRESHOLD_DAYS (${lifecycleConfig.hideThresholdDays}) must be smaller than USER_PURGE_THRESHOLD_DAYS (${lifecycleConfig.purgeThresholdDays}); purge scheduler not started`
        );
        return Promise.resolve();
    }

    purgeIntervalHandle = setInterval(
        () => void runPurgeSafely(lifecycleConfig.purgeThresholdDays),
        lifecycleConfig.purgeIntervalHours * 60 * 60 * 1000
    );
    // Don't let the recurring purge keep the process alive on its own.
    purgeIntervalHandle.unref();
    return runPurgeSafely(lifecycleConfig.purgeThresholdDays);
}

export function stopInactiveUserPurgeScheduler(): void {
    if (purgeIntervalHandle !== undefined) {
        clearInterval(purgeIntervalHandle);
        purgeIntervalHandle = undefined;
    }
}

async function runPurgeSafely(purgeThresholdDays: number): Promise<void> {
    try {
        await purgeInactiveUsers(purgeThresholdDays);
    } catch (error) {
        Logger.error(`purgeInactiveUsers: run failed: ${String(error)}`);
    }
}
