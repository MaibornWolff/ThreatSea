/**
 * @module auth.service - Defines services for the authentication
 */

import jwt from "jsonwebtoken";
import { JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET } from "#config/config.js";
import { db } from "#db/index.js";
import { users } from "#db/schema.js";
import { and, eq, isNull, sql } from "drizzle-orm";
import { UnauthorizedError } from "#errors/unauthorized.error.js";

export interface OidcProfile {
    sub: string;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    displayName?: string | undefined;
    picture?: string | undefined;
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
                // Link existing email-matched user to their OIDC sub
                await tx
                    .update(users)
                    .set({ oidcSub: userObject.sub, updatedAt: sql`now()` })
                    .where(eq(users.id, user.id));
            }
        }

        if (user) {
            // Update profile if name has changed
            if (
                user.firstname !== firstName ||
                user.lastname !== lastName ||
                user.email !== email ||
                user.picture !== userObject.picture
            ) {
                await tx
                    .update(users)
                    .set({
                        firstname: firstName,
                        lastname: lastName,
                        email: email,
                        picture: userObject.picture,
                        updatedAt: sql`now()`,
                    })
                    .where(eq(users.id, user.id));
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
                    picture: userObject.picture,
                })
                .returning()
        ).at(0);
    });

    if (!user) {
        throw new Error("Failed to retrieve user from database");
    }

    const threatseaAccessToken = jwt.sign(
        {
            userId: user.id,
            oidcId: userObject.sub,
            email: email,
            firstname: firstName,
            lastname: lastName,
            displayName: displayName,
            picture: userObject.picture,
        },
        JWT_SECRET,
        { expiresIn: "7d", issuer: JWT_ISSUER, audience: JWT_AUDIENCE }
    );

    return threatseaAccessToken;
}
