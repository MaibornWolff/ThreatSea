/**
 * @module auth.service - Defines services for the authentication
 */

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "#config/config.js";
import { db } from "#db/index.js";
import { users } from "#db/schema.js";
import { eq } from "drizzle-orm";
import { UnauthorizedError } from "#errors/unauthorized.error.js";
export interface OidcProfile {
    sub: string;
    email?: string | undefined;
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

    const user = await db.transaction(async (tx) => {
        const user = await tx.query.users.findFirst({ where: eq(users.email, email) });

        if (user) {
            return user;
        }

        return (
            await tx
                .insert(users)
                .values({
                    firstname: firstName,
                    lastname: lastName,
                    email,
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
            displayName: userObject.displayName,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return threatseaAccessToken;
}
