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
    profileSynced?: boolean | undefined;
}

export async function findOidcUserBySub(oidcSub: string): Promise<{ profileSyncedAt: string | null } | undefined> {
    // Read-only pre-check that only informs the userinfo-fetch decision: when THIS OIDC subject's
    // profile was last synced from userinfo. It matches solely on oidcSub (uniquely indexed) — a
    // user found only by email has never been OIDC-synced, so it is treated as unknown (fetch) by
    // the caller. The authoritative resolve/link/upsert still happens transactionally in
    // buildThreatSeaAccessToken, so a stale read here under a concurrent race is benign.
    return await db.query.users.findFirst({
        where: eq(users.oidcSub, oidcSub),
        columns: { profileSyncedAt: true },
    });
}

export async function buildThreatSeaAccessToken(userObject: OidcProfile): Promise<string> {
    // Normalize to lowercase so an IdP that varies email casing (ID token vs userinfo, UPN vs
    // canonical mailbox) can't split one account into duplicates.
    const email = userObject.email?.toLowerCase();
    if (!email) {
        throw new UnauthorizedError("No email found in user profile object.");
    }

    // An email is trustworthy only if the IdP asserts it verified, or an operator has opted into
    // unverified linking via OIDC_ALLOW_UNVERIFIED_EMAIL_LINKING. An untrusted email is never
    // written through: it can neither overwrite an existing account nor seed a new one, so an
    // attacker-chosen address can't surface in member pickers as a trusted identity.
    const emailTrusted = userObject.emailVerified === true || ALLOW_UNVERIFIED_EMAIL_LINKING;

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
                if (!emailTrusted) {
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
            const nextLastName = userObject.lastName ?? user.lastname;
            // An untrusted email must not overwrite the stored one; login still proceeds with the
            // address already on file. A trusted email is allowed to propagate a change.
            const nextEmail = emailTrusted ? email : user.email;
            const profileChanged =
                user.firstname !== nextFirstName || user.lastname !== nextLastName || user.email !== nextEmail;

            // Fold the last-login refresh into the profile write so a login is at most one
            // UPDATE. lastLoginAt on its own must not bump updatedAt.
            const touchedRows = await tx
                .update(users)
                .set({
                    lastLoginAt: sql`now()`,
                    // Track when userinfo was last consulted, independent of lastLoginAt, so the
                    // staleness gate keeps firing for users who log in more often than the refresh
                    // window. Bumping this must not bump updatedAt.
                    ...(userObject.profileSynced ? { profileSyncedAt: sql`now()` } : {}),
                    ...(profileChanged
                        ? {
                              firstname: nextFirstName,
                              lastname: nextLastName,
                              email: nextEmail,
                              updatedAt: sql`now()`,
                          }
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

        // New account: an unverified, attacker-chosen email must not seed a row that member pickers
        // would later surface as a trusted identity.
        if (!emailTrusted) {
            throw new UnauthorizedError(
                "Email not verified by IdP; refusing to create a new account — see OIDC_ALLOW_UNVERIFIED_EMAIL_LINKING"
            );
        }

        return (
            await tx
                .insert(users)
                .values({
                    firstname: userObject.firstName ?? "",
                    lastname: userObject.lastName ?? userObject.displayName ?? email,
                    email: email,
                    oidcSub: userObject.sub,
                    ...(userObject.profileSynced ? { profileSyncedAt: sql`now()` } : {}),
                })
                .returning()
        ).at(0);
    });

    if (!user) {
        throw new Error("Failed to retrieve user from database");
    }

    // Build the JWT from the persisted row so its email and names reflect exactly what the DB now
    // holds — never a rejected/untrusted incoming email.
    const displayName = userObject.displayName ?? (`${user.firstname} ${user.lastname}`.trim() || user.email);

    const threatseaAccessToken = await new SignJWT({
        userId: user.id,
        oidcId: userObject.sub,
        email: user.email,
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
