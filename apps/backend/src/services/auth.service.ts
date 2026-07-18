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

export async function buildThreatSeaAccessToken(userObject: OidcProfile): Promise<string> {
    const email = userObject.email;
    if (!email) {
        throw new UnauthorizedError("No email found in user profile object.");
    }

    const firstName = userObject.firstName ?? "";
    const lastName = userObject.lastName ?? userObject.displayName ?? email;
    const displayName = userObject.displayName ?? (`${firstName} ${lastName}`.trim() || email);

    const user = await db.transaction(async (tx) => {
        // Look up by OIDC sub first, fall back to email for initial account linking
        let user = await tx.query.users.findFirst({ where: eq(users.oidcSub, userObject.sub) });

        if (!user) {
            const emailMatches = await tx.query.users.findMany({
                where: and(eq(users.email, email), isNull(users.oidcSub)),
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
            const profileChanged = user.firstname !== firstName || user.lastname !== lastName || user.email !== email;

            // Fold the last-login refresh into the profile write so a login is at most one
            // UPDATE. lastLoginAt on its own must not bump updatedAt.
            const touchedRows = await tx
                .update(users)
                .set({
                    lastLoginAt: sql`now()`,
                    ...(profileChanged
                        ? { firstname: firstName, lastname: lastName, email: email, updatedAt: sql`now()` }
                        : {}),
                })
                .where(eq(users.id, user.id))
                .returning({ id: users.id });

            // A concurrent purge may have deleted this user between the lookup above and this
            // UPDATE; if the row is gone we must not mint a token for an account that no longer exists.
            if (touchedRows.length === 0) {
                throw new UnauthorizedError("User no longer exists");
            }
            return user;
        }

        return (
            await tx
                .insert(users)
                .values({
                    firstname: firstName,
                    lastname: lastName,
                    email: email,
                    oidcSub: userObject.sub,
                })
                .returning()
        ).at(0);
    });

    if (!user) {
        throw new Error("Failed to retrieve user from database");
    }

    const threatseaAccessToken = await new SignJWT({
        userId: user.id,
        oidcId: userObject.sub,
        email: email,
        firstname: firstName,
        lastname: lastName,
        displayName: displayName,
    })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .sign(JWT_SECRET);

    return threatseaAccessToken;
}
