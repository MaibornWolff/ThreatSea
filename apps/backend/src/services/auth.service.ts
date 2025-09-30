/**
 * @module auth.service - Defines services for the authentication
 */

import jwt from "jsonwebtoken";
import { azureConfig, JWT_SECRET } from "#config/config.js";
import { db } from "#db/index.js";
import { users } from "#db/schema.js";
import { eq } from "drizzle-orm";

export interface AzureProfile {
    _json: {
        givenName?: string;
        surname?: string;
        displayName?: string;
        userPrincipalName: string;
    };
    id: string;
}

const tenantId = azureConfig.tenantId;

export async function buildThreatSeaAccessToken(userObject: AzureProfile, isPrivileged: number): Promise<string> {
    // UPN is mandatory in AD, whereas the other attributes are not
    const email = userObject._json.userPrincipalName;
    let firstName = "";
    let lastname;
    if (userObject._json.givenName && userObject._json.surname) {
        firstName = userObject._json.givenName;
        lastname = userObject._json.surname;
    } else if (userObject._json.displayName) {
        lastname = userObject._json.displayName;
    } else {
        lastname = email;
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
                    firstname: firstName,
                    lastname: lastname,
                    email: email,
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
            azureId: userObject.id,
            tenantId,
            email: email,
            firstname: firstName,
            lastname: lastname,
            isPrivileged,
        },
        JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );

    return threatseaAccessToken;
}
