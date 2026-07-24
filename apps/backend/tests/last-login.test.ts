/// <reference types="vitest/globals" />
/**
 * Module that defines tests for last-login tracking on login.
 */
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "#db/index.js";
import { users } from "#db/schema.js";
import { buildThreatSeaAccessToken } from "#services/auth.service.js";

async function findUserWithRecentLogin(userId: number) {
    return await db.query.users.findFirst({
        where: and(eq(users.id, userId), gt(users.lastLoginAt, sql`now() - interval '1 minute'`)),
    });
}

async function makeUserStale(userId: number): Promise<void> {
    await db
        .update(users)
        .set({ lastLoginAt: sql`now() - interval '100 days'` })
        .where(eq(users.id, userId));
}

describe("last login tracking", () => {
    it("sets lastLoginAt on first login (insert path)", async () => {
        await buildThreatSeaAccessToken({
            sub: "last-login-insert-sub",
            email: "last-login-insert@threatsea.test",
            emailVerified: true,
            firstName: "Insert",
            lastName: "Path",
        });

        const createdUser = await db.query.users.findFirst({
            where: eq(users.oidcSub, "last-login-insert-sub"),
        });
        expect(createdUser).toBeDefined();
        const recentUser = await findUserWithRecentLogin(createdUser!.id);
        expect(recentUser?.email).toBe("last-login-insert@threatsea.test");
    });

    it("refreshes lastLoginAt on login when the profile is unchanged", async () => {
        const profile = {
            sub: "last-login-unchanged-sub",
            email: "last-login-unchanged@threatsea.test",
            emailVerified: true,
            firstName: "Unchanged",
            lastName: "Path",
        };
        await buildThreatSeaAccessToken(profile);
        const existingUser = (await db.query.users.findFirst({ where: eq(users.oidcSub, profile.sub) }))!;
        await makeUserStale(existingUser.id);

        await buildThreatSeaAccessToken(profile);

        const refreshedUser = await findUserWithRecentLogin(existingUser.id);
        expect(refreshedUser?.id).toBe(existingUser.id);
    });

    it("does not bump updatedAt when only the login timestamp is refreshed", async () => {
        const profile = {
            sub: "last-login-noupdate-sub",
            email: "last-login-noupdate@threatsea.test",
            emailVerified: true,
            firstName: "No",
            lastName: "Update",
        };
        await buildThreatSeaAccessToken(profile);
        const beforeUser = (await db.query.users.findFirst({ where: eq(users.oidcSub, profile.sub) }))!;

        await buildThreatSeaAccessToken(profile);

        const afterUser = (await db.query.users.findFirst({ where: eq(users.oidcSub, profile.sub) }))!;
        expect(afterUser.updatedAt).toBe(beforeUser.updatedAt);
        expect(new Date(afterUser.lastLoginAt).getTime()).toBeGreaterThanOrEqual(
            new Date(beforeUser.lastLoginAt).getTime()
        );
    });

    it("refreshes lastLoginAt on login when the profile changed", async () => {
        const profile = {
            sub: "last-login-renamed-sub",
            email: "last-login-renamed@threatsea.test",
            emailVerified: true,
            firstName: "Original",
            lastName: "Name",
        };
        await buildThreatSeaAccessToken(profile);
        const existingUser = (await db.query.users.findFirst({ where: eq(users.oidcSub, profile.sub) }))!;
        await makeUserStale(existingUser.id);

        await buildThreatSeaAccessToken({ ...profile, lastName: "Renamed" });

        const refreshedUser = await findUserWithRecentLogin(existingUser.id);
        expect(refreshedUser?.lastname).toBe("Renamed");
    });

    it("refreshes lastLoginAt when linking an existing email-only user to an OIDC sub", async () => {
        const insertedUser = (
            await db
                .insert(users)
                .values({
                    firstname: "Link",
                    lastname: "Path",
                    email: "last-login-link@threatsea.test",
                    lastLoginAt: sql`now() - interval '100 days'`,
                })
                .returning()
        ).at(0)!;

        await buildThreatSeaAccessToken({
            sub: "last-login-link-sub",
            email: "last-login-link@threatsea.test",
            emailVerified: true,
            firstName: "Link",
            lastName: "Path",
        });

        const linkedUser = await findUserWithRecentLogin(insertedUser.id);
        expect(linkedUser?.oidcSub).toBe("last-login-link-sub");
    });
});
