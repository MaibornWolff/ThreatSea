import { decodeJwt } from "jose";
import { eq } from "drizzle-orm";
import { db } from "#db/index.js";
import { users } from "#db/schema.js";
import { buildThreatSeaAccessToken, OidcProfile } from "#services/auth.service.js";
import { UnauthorizedError } from "#errors/unauthorized.error.js";

const configOverrides = vi.hoisted(() => ({ ALLOW_UNVERIFIED_EMAIL_LINKING: false }));

vi.mock("#config/config.js", async (importOriginal) => {
    const actualConfig = await importOriginal<typeof import("#config/config.js")>();
    return {
        ...actualConfig,
        get ALLOW_UNVERIFIED_EMAIL_LINKING() {
            return configOverrides.ALLOW_UNVERIFIED_EMAIL_LINKING;
        },
    };
});

async function createUser(values: { firstname: string; lastname: string; email: string; oidcSub?: string }) {
    return (await db.insert(users).values(values).returning()).at(0)!;
}

async function findUserById(userId: number) {
    return await db.query.users.findFirst({ where: eq(users.id, userId) });
}

beforeEach(() => {
    configOverrides.ALLOW_UNVERIFIED_EMAIL_LINKING = false;
});

describe("buildThreatSeaAccessToken account linking", () => {
    it("links an existing unlinked user when the email is verified", async () => {
        const existingUser = await createUser({
            firstname: "Linda",
            lastname: "Linkable",
            email: "linda.linkable@example.com",
        });
        const profile: OidcProfile = {
            sub: "sub-linkable",
            email: "linda.linkable@example.com",
            emailVerified: true,
            firstName: "Linda",
            lastName: "Linkable",
        };

        const accessToken = await buildThreatSeaAccessToken(profile);

        expect(decodeJwt(accessToken)["userId"]).toBe(existingUser.id);
        const linkedUser = await findUserById(existingUser.id);
        expect(linkedUser?.oidcSub).toBe("sub-linkable");
    });

    it("links a case-mismatched existing user and normalizes the stored email", async () => {
        const existingUser = await createUser({
            firstname: "Casey",
            lastname: "Mixed",
            email: "Casey.Mixed@Example.com",
        });
        const profile: OidcProfile = {
            sub: "sub-case",
            email: "casey.mixed@example.com",
            emailVerified: true,
            firstName: "Casey",
            lastName: "Mixed",
        };

        await buildThreatSeaAccessToken(profile);

        const linkedUser = await findUserById(existingUser.id);
        expect(linkedUser?.oidcSub).toBe("sub-case");
        expect(linkedUser?.email).toBe("casey.mixed@example.com");
    });

    it("refuses to link an existing user when the email is not verified", async () => {
        const existingUser = await createUser({
            firstname: "Victor",
            lastname: "Victim",
            email: "victor.victim@example.com",
        });
        const profile: OidcProfile = {
            sub: "sub-attacker",
            email: "victor.victim@example.com",
            emailVerified: false,
            firstName: "Eve",
            lastName: "Attacker",
        };

        await expect(buildThreatSeaAccessToken(profile)).rejects.toThrow(UnauthorizedError);

        const unchangedUser = await findUserById(existingUser.id);
        expect(unchangedUser?.oidcSub).toBeNull();
        expect(unchangedUser?.firstname).toBe("Victor");
    });

    it("refuses to link an existing user when the email_verified claim is missing", async () => {
        const existingUser = await createUser({
            firstname: "Missy",
            lastname: "Missingclaim",
            email: "missy.missingclaim@example.com",
        });
        const profile: OidcProfile = {
            sub: "sub-missing-claim",
            email: "missy.missingclaim@example.com",
            firstName: "Missy",
            lastName: "Missingclaim",
        };

        await expect(buildThreatSeaAccessToken(profile)).rejects.toThrow(UnauthorizedError);

        const unchangedUser = await findUserById(existingUser.id);
        expect(unchangedUser?.oidcSub).toBeNull();
    });

    it("links an unverified email when the escape hatch is enabled", async () => {
        configOverrides.ALLOW_UNVERIFIED_EMAIL_LINKING = true;
        const existingUser = await createUser({
            firstname: "Opt",
            lastname: "In",
            email: "opt.in@example.com",
        });
        const profile: OidcProfile = {
            sub: "sub-opt-in",
            email: "opt.in@example.com",
            emailVerified: false,
            firstName: "Opt",
            lastName: "In",
        };

        await buildThreatSeaAccessToken(profile);

        const linkedUser = await findUserById(existingUser.id);
        expect(linkedUser?.oidcSub).toBe("sub-opt-in");
    });

    it("logs in an already-linked user regardless of email_verified", async () => {
        const existingUser = await createUser({
            firstname: "Already",
            lastname: "Linked",
            email: "already.linked@example.com",
            oidcSub: "sub-already-linked",
        });
        const profile: OidcProfile = {
            sub: "sub-already-linked",
            email: "already.linked@example.com",
            emailVerified: false,
            firstName: "Already",
            lastName: "Linked",
        };

        const accessToken = await buildThreatSeaAccessToken(profile);

        expect(decodeJwt(accessToken)["userId"]).toBe(existingUser.id);
    });

    it("creates a fresh account even when the email is not verified", async () => {
        const profile: OidcProfile = {
            sub: "sub-fresh",
            email: "fresh.account@example.com",
            emailVerified: false,
            firstName: "Fresh",
            lastName: "Account",
        };

        const accessToken = await buildThreatSeaAccessToken(profile);

        expect(accessToken).toBeTypeOf("string");
        const createdUser = await db.query.users.findFirst({ where: eq(users.oidcSub, "sub-fresh") });
        expect(createdUser?.email).toBe("fresh.account@example.com");
    });

    it("rejects when two unlinked users share the email", async () => {
        await createUser({ firstname: "First", lastname: "Duplicate", email: "duplicate@example.com" });
        await createUser({ firstname: "Second", lastname: "Duplicate", email: "duplicate@example.com" });
        const profile: OidcProfile = {
            sub: "sub-ambiguous",
            email: "duplicate@example.com",
            emailVerified: true,
            firstName: "Which",
            lastName: "One",
        };

        await expect(buildThreatSeaAccessToken(profile)).rejects.toThrow("Ambiguous account link for email");
    });

    it("persists a changed name on login", async () => {
        const existingUser = await createUser({
            firstname: "Old",
            lastname: "Name",
            email: "rename.me@example.com",
            oidcSub: "sub-rename",
        });
        const profile: OidcProfile = {
            sub: "sub-rename",
            email: "rename.me@example.com",
            emailVerified: true,
            firstName: "New",
            lastName: "Name",
        };

        await buildThreatSeaAccessToken(profile);

        const updatedUser = await findUserById(existingUser.id);
        expect(updatedUser?.firstname).toBe("New");
    });
});
