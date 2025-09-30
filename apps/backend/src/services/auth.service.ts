/**
 * @module auth.service - Defines services for the authentication
 */

import jwt from "jsonwebtoken";
import { azureConfig, JWT_SECRET } from "#config/config.js";
import { db } from "#db/index.js";
import { users } from "#db/schema.js";
import { eq } from "drizzle-orm";
import { GenericOidcUserProfile } from "#types/auth.types.js";
import { mapGenericProfile } from "#utils/mapGenericProfile.js";

export interface AzureProfile {
    _json: {
        givenName?: string;
        surname?: string;
        displayName?: string;
        userPrincipalName: string;
    };
    id: string;
}

export async function buildThreatSeaAccessToken(
    userObject: GenericOidcUserProfile,
    isPrivileged: number,
    tenantId = azureConfig.tenantId
): Promise<string> {
    // Extrahiere Felder!
    const { email, firstname, lastname, displayName, providerId } = mapGenericProfile(userObject);

    if (!email) {
        throw new Error("No email found in user profile object.");
    }

    const user = await db.transaction(async (tx) => {
        const user = await tx.query.users.findFirst({ where: eq(users.email, email) });

        if (user) {
            return user;
        }

        return (
            await tx
                .insert(users)
                .values({
                    firstname,
                    lastname,
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
            providerId, // kann oid, id, sub je nach Provider sein!
            tenantId,
            email,
            firstname,
            lastname,
            displayName,
            isPrivileged,
        },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    return threatseaAccessToken;
}
