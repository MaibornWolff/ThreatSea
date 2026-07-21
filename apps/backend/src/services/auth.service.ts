/**
 * @module auth.service - Defines services for the authentication
 */

import { SignJWT } from "jose";
import { ALLOW_UNVERIFIED_EMAIL_LINKING, JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET } from "#config/config.js";
import { db } from "#db/index.js";
import { users } from "#db/schema.js";
import { and, eq, isNull, sql } from "drizzle-orm";
import { UnauthorizedError } from "#errors/unauthorized.error.js";

export interface OidcProfile {
    sub: string;
    email?: string | undefined;
    emailVerified?: boolean | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    displayName?: string | undefined;
}

export async function findOidcUserBySub(oidcSub: string): Promise<{ lastLoginAt: string } | undefined> {
    // Read-only pre-check that only informs the userinfo-fetch decision: how recently THIS OIDC
    // subject last logged in. It matches solely on oidcSub (uniquely indexed) — a user found only
    // by email has never been OIDC-synced, so it is treated as unknown (fetch) by the caller, not
    // as a "fresh" user. The authoritative resolve/link/upsert still happens transactionally in
    // buildThreatSeaAccessToken, so a stale read here under a concurrent race is benign.
    return await db.query.users.findFirst({
        where: eq(users.oidcSub, oidcSub),
        columns: { lastLoginAt: true },
    });
}

export async function buildThreatSeaAccessToken(userObject: OidcProfile): Promise<string> {
    // Normalize to lowercase so an IdP that varies email casing (ID token vs userinfo, UPN vs
    // canonical mailbox) can't split one account into duplicates.
    const email = userObject.email?.toLowerCase();
    if (!email) {
        throw new UnauthorizedError("No email found in user profile object.");
    }

    const user = await db.transaction(async (tx) => {
        // Look up by OIDC sub first, fall back to email for initial account linking
        let user = await tx.query.users.findFirst({ where: eq(users.oidcSub, userObject.sub) });

        if (!user) {
            const emailMatches = await tx.query.users.findMany({
                where: and(sql`lower(${users.email}) = ${email}`, isNull(users.oidcSub)),
            });

            if (emailMatches.length > 1) {
                throw new UnauthorizedError("Ambiguous account link for email");
            }

            user = emailMatches.at(0);
            if (user) {
                if (userObject.emailVerified !== true && !ALLOW_UNVERIFIED_EMAIL_LINKING) {
                    throw new UnauthorizedError(
                        "Email not verified by IdP; refusing to link existing account — see OIDC_ALLOW_UNVERIFIED_EMAIL_LINKING"
                    );
                }
                // Link existing email-matched user to their OIDC sub
                await tx
                    .update(users)
                    .set({ oidcSub: userObject.sub, updatedAt: sql`now()` })
                    .where(eq(users.id, user.id));
            }
        }

        if (user) {
            // No-clobber: for an existing user an absent incoming name coalesces to the stored
            // value rather than the email fallback, so a userinfo-less login can't wipe a name.
            const nextFirstName = userObject.firstName ?? user.firstname;
            const nextLastName = userObject.lastName ?? userObject.displayName ?? user.lastname;
            const profileChanged =
                user.firstname !== nextFirstName || user.lastname !== nextLastName || user.email !== email;

            // Fold the last-login refresh into the profile write so a login is at most one
            // UPDATE. lastLoginAt on its own must not bump updatedAt.
            const touchedRows = await tx
                .update(users)
                .set({
                    lastLoginAt: sql`now()`,
                    ...(profileChanged
                        ? { firstname: nextFirstName, lastname: nextLastName, email: email, updatedAt: sql`now()` }
                        : {}),
                })
                .where(eq(users.id, user.id))
                .returning();

            // A concurrent purge may have deleted this user between the lookup above and this
            // UPDATE; if the row is gone we must not mint a token for an account that no longer exists.
            if (touchedRows.length === 0) {
                throw new UnauthorizedError("User no longer exists");
            }
            return touchedRows.at(0);
        }

        return (
            await tx
                .insert(users)
                .values({
                    firstname: userObject.firstName ?? "",
                    lastname: userObject.lastName ?? userObject.displayName ?? email,
                    email: email,
                    oidcSub: userObject.sub,
                })
                .returning()
        ).at(0);
    });

    if (!user) {
        throw new Error("Failed to retrieve user from database");
    }

    // Build the JWT from the persisted row so its names reflect exactly what the DB now holds.
    const displayName = userObject.displayName ?? (`${user.firstname} ${user.lastname}`.trim() || email);

    const threatseaAccessToken = await new SignJWT({
        userId: user.id,
        oidcId: userObject.sub,
        email: email,
        firstname: user.firstname,
        lastname: user.lastname,
        displayName: displayName,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .sign(JWT_SECRET);

    return threatseaAccessToken;
}
