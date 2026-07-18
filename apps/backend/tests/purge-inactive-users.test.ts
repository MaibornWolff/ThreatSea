/// <reference types="vitest/globals" />

/**
 * Module that defines tests for the inactive-user purge job.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "#db/index.js";
import { catalogs, projects, users, usersCatalogs, usersProjects } from "#db/schema.js";
import {
    purgeInactiveUsers,
    startInactiveUserPurgeScheduler,
    stopInactiveUserPurgeScheduler,
} from "#jobs/purge-inactive-users.job.js";
import { Logger } from "#logging/index.js";
import { LANGUAGES } from "#types/languages.type.js";
import { USER_ROLES } from "#types/user-roles.types.js";

async function insertTestUser(email: string, daysSinceLastLogin?: number): Promise<number> {
    const insertedUser = (
        await db
            .insert(users)
            .values({
                firstname: "Purge",
                lastname: "Test",
                email: email,
                ...(daysSinceLastLogin === undefined
                    ? {}
                    : { lastLoginAt: sql`now() - (${daysSinceLastLogin} * interval '1 day')` }),
            })
            .returning({ id: users.id })
    ).at(0)!;
    return insertedUser.id;
}

async function insertTestCatalog(name: string): Promise<number> {
    return (await db.insert(catalogs).values({ name: name, language: LANGUAGES.EN }).returning()).at(0)!.id;
}

async function insertTestProject(name: string, catalogId: number): Promise<number> {
    return (
        await db.insert(projects).values({ name: name, description: "purge test", catalogId: catalogId }).returning()
    ).at(0)!.id;
}

async function userExists(userId: number): Promise<boolean> {
    return (await db.query.users.findFirst({ where: eq(users.id, userId) })) !== undefined;
}

describe("purgeInactiveUsers", () => {
    it("deletes an inactive co-owner and cascades membership rows", async () => {
        const activeOwnerId = await insertTestUser("purge-happy-active@threatsea.test");
        const zombieCoOwnerId = await insertTestUser("purge-happy-zombie@threatsea.test", 400);
        const catalogId = await insertTestCatalog("purge-happy-catalog");
        const projectId = await insertTestProject("purge-happy-project", catalogId);
        await db.insert(usersProjects).values([
            { projectId: projectId, userId: activeOwnerId, role: USER_ROLES.OWNER },
            { projectId: projectId, userId: zombieCoOwnerId, role: USER_ROLES.OWNER },
        ]);
        await db.insert(usersCatalogs).values([
            { catalogId: catalogId, userId: activeOwnerId, role: USER_ROLES.OWNER },
            { catalogId: catalogId, userId: zombieCoOwnerId, role: USER_ROLES.VIEWER },
        ]);

        await purgeInactiveUsers();

        expect(await userExists(zombieCoOwnerId)).toBe(false);
        expect(await userExists(activeOwnerId)).toBe(true);
        const zombieProjectMembership = await db.query.usersProjects.findFirst({
            where: eq(usersProjects.userId, zombieCoOwnerId),
        });
        expect(zombieProjectMembership).toBeUndefined();
        const zombieCatalogMembership = await db.query.usersCatalogs.findFirst({
            where: eq(usersCatalogs.userId, zombieCoOwnerId),
        });
        expect(zombieCatalogMembership).toBeUndefined();
        const activeOwnerMembership = await db.query.usersProjects.findFirst({
            where: eq(usersProjects.userId, activeOwnerId),
        });
        expect(activeOwnerMembership?.role).toBe(USER_ROLES.OWNER);
    });

    it("skips an inactive sole project owner and logs a warning", async () => {
        const warningSpy = vi.spyOn(Logger, "warning");
        const zombieSoleOwnerId = await insertTestUser("purge-sole-project@threatsea.test", 400);
        const catalogId = await insertTestCatalog("purge-sole-project-catalog");
        const projectId = await insertTestProject("purge-sole-project-project", catalogId);
        await db
            .insert(usersProjects)
            .values({ projectId: projectId, userId: zombieSoleOwnerId, role: USER_ROLES.OWNER });

        await purgeInactiveUsers();

        expect(await userExists(zombieSoleOwnerId)).toBe(true);
        const warningMessages = warningSpy.mock.calls.flat();
        expect(
            warningMessages.some(
                (message) => message.includes(zombieSoleOwnerId.toString()) && message.includes(`project ${projectId}`)
            )
        ).toBe(true);
    });

    it("skips an inactive sole catalog owner and logs a warning", async () => {
        const warningSpy = vi.spyOn(Logger, "warning");
        const zombieSoleOwnerId = await insertTestUser("purge-sole-catalog@threatsea.test", 400);
        const catalogId = await insertTestCatalog("purge-sole-catalog-catalog");
        await db
            .insert(usersCatalogs)
            .values({ catalogId: catalogId, userId: zombieSoleOwnerId, role: USER_ROLES.OWNER });

        await purgeInactiveUsers();

        expect(await userExists(zombieSoleOwnerId)).toBe(true);
        const warningMessages = warningSpy.mock.calls.flat();
        expect(
            warningMessages.some(
                (message) => message.includes(zombieSoleOwnerId.toString()) && message.includes(`catalog ${catalogId}`)
            )
        ).toBe(true);
    });

    it("keeps only the sole owner when every member of a project is inactive", async () => {
        const zombieSoleOwnerId = await insertTestUser("purge-all-zombie-owner@threatsea.test", 400);
        const zombieEditorId = await insertTestUser("purge-all-zombie-editor@threatsea.test", 400);
        const catalogId = await insertTestCatalog("purge-all-zombie-catalog");
        const projectId = await insertTestProject("purge-all-zombie-project", catalogId);
        await db.insert(usersProjects).values([
            { projectId: projectId, userId: zombieSoleOwnerId, role: USER_ROLES.OWNER },
            { projectId: projectId, userId: zombieEditorId, role: USER_ROLES.EDITOR },
        ]);

        await purgeInactiveUsers();

        expect(await userExists(zombieSoleOwnerId)).toBe(true);
        expect(await userExists(zombieEditorId)).toBe(false);
        const remainingOwnerMembership = await db.query.usersProjects.findFirst({
            where: eq(usersProjects.userId, zombieSoleOwnerId),
        });
        expect(remainingOwnerMembership?.role).toBe(USER_ROLES.OWNER);
    });

    it("treats a user exactly at the purge threshold as a candidate (boundary is inclusive)", async () => {
        const boundaryUserId = await insertTestUser("purge-boundary@threatsea.test", 365);

        await purgeInactiveUsers();

        expect(await userExists(boundaryUserId)).toBe(false);
    });

    it("keeps both owners when a project's only two owners are both inactive", async () => {
        const firstZombieOwnerId = await insertTestUser("purge-costale-project-first@threatsea.test", 400);
        const secondZombieOwnerId = await insertTestUser("purge-costale-project-second@threatsea.test", 400);
        const catalogId = await insertTestCatalog("purge-costale-project-catalog");
        const projectId = await insertTestProject("purge-costale-project-project", catalogId);
        await db.insert(usersProjects).values([
            { projectId: projectId, userId: firstZombieOwnerId, role: USER_ROLES.OWNER },
            { projectId: projectId, userId: secondZombieOwnerId, role: USER_ROLES.OWNER },
        ]);

        await purgeInactiveUsers();

        expect(await userExists(firstZombieOwnerId)).toBe(true);
        expect(await userExists(secondZombieOwnerId)).toBe(true);
    });

    it("keeps both owners when a catalog's only two owners are both inactive", async () => {
        const firstZombieOwnerId = await insertTestUser("purge-costale-catalog-first@threatsea.test", 400);
        const secondZombieOwnerId = await insertTestUser("purge-costale-catalog-second@threatsea.test", 400);
        const catalogId = await insertTestCatalog("purge-costale-catalog-catalog");
        await db.insert(usersCatalogs).values([
            { catalogId: catalogId, userId: firstZombieOwnerId, role: USER_ROLES.OWNER },
            { catalogId: catalogId, userId: secondZombieOwnerId, role: USER_ROLES.OWNER },
        ]);

        await purgeInactiveUsers();

        expect(await userExists(firstZombieOwnerId)).toBe(true);
        expect(await userExists(secondZombieOwnerId)).toBe(true);
    });

    it("deletes many unrelated inactive users in a single run", async () => {
        const inactiveUserIds = await Promise.all(
            Array.from({ length: 40 }, (_unused, index) => insertTestUser(`purge-bulk-${index}@threatsea.test`, 400))
        );

        await purgeInactiveUsers();

        const survivors = await Promise.all(inactiveUserIds.map((userId) => userExists(userId)));
        expect(survivors.every((exists) => exists === false)).toBe(true);
    });

    it("respects a custom purge threshold", async () => {
        const oldUserId = await insertTestUser("purge-custom-old@threatsea.test", 250);
        const recentUserId = await insertTestUser("purge-custom-recent@threatsea.test", 150);

        await purgeInactiveUsers(200);

        expect(await userExists(oldUserId)).toBe(false);
        expect(await userExists(recentUserId)).toBe(true);
    });
});

describe("startInactiveUserPurgeScheduler", () => {
    const validLifecycleConfig = {
        purgeEnabled: true,
        hideThresholdDays: 90,
        purgeThresholdDays: 365,
        purgeIntervalHours: 24,
    };

    afterEach(() => {
        stopInactiveUserPurgeScheduler();
    });

    it("runs a purge immediately when enabled", async () => {
        const zombieUserId = await insertTestUser("scheduler-enabled-zombie@threatsea.test", 400);

        await startInactiveUserPurgeScheduler(validLifecycleConfig);

        expect(await userExists(zombieUserId)).toBe(false);
    });

    it("does not purge when disabled", async () => {
        const zombieUserId = await insertTestUser("scheduler-disabled-zombie@threatsea.test", 400);

        await startInactiveUserPurgeScheduler({ ...validLifecycleConfig, purgeEnabled: false });

        expect(await userExists(zombieUserId)).toBe(true);
    });

    it("ignores a duplicate start so a second interval is not leaked", async () => {
        const warningSpy = vi.spyOn(Logger, "warning");

        await startInactiveUserPurgeScheduler(validLifecycleConfig);
        await startInactiveUserPurgeScheduler(validLifecycleConfig);

        const warningMessages = warningSpy.mock.calls.flat();
        expect(warningMessages.some((message) => message.includes("already running"))).toBe(true);
    });

    it("logs an error and refuses to start when the hide threshold is not below the purge threshold", async () => {
        const errorSpy = vi.spyOn(Logger, "error");
        const zombieUserId = await insertTestUser("scheduler-invalid-zombie@threatsea.test", 400);

        await startInactiveUserPurgeScheduler({ ...validLifecycleConfig, hideThresholdDays: 400 });

        expect(await userExists(zombieUserId)).toBe(true);
        const errorMessages = errorSpy.mock.calls.flat();
        expect(errorMessages.some((message) => message.includes("USER_HIDE_THRESHOLD_DAYS"))).toBe(true);
    });
});
