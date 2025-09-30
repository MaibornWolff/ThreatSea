/**
 * @module revoked-tokens.service - Module that manages all revoked tokens.
 */
import { eq, lt } from "drizzle-orm";
import { db } from "#db/index.js";
import { Token, tokens } from "#db/schema.js";

/**
 * Gets all stored revoked tokens.
 *
 * @returns The stored tokens from the database.
 */
export async function getRevokedTokens(): Promise<Token[]> {
    return await db.select().from(tokens);
}

/**
 * Marks a token as revoked.
 * Skips, if the token is already inside the database
 *
 * @param {string} token whole accessToken
 * @param {number} expiresAt unix timestamp of expiration date
 * @returns
 */
export async function revokeToken(token: string, expiresAt: number): Promise<Token> {
    return await db.transaction(async (tx) => {
        const existingToken = await tx.query.tokens.findFirst({ where: eq(tokens.token, token) });
        if (existingToken) {
            return existingToken;
        }

        return (
            await tx
                .insert(tokens)
                .values({
                    token,
                    expiresAt,
                })
                .returning()
        ).at(0)!;
    });
}

/**
 * Deletes all expired tokens that are in the database.
 *
 *
 */
export async function deleteExpiredTokens() {
    const current = Math.floor(+new Date() / 1000);
    return await db.delete(tokens).where(lt(tokens.expiresAt, current));
}

/**
 * Checks if a specific token exists inside the database
 *
 * @param {String} givenToken
 * @returns true, if the token exists, false otherwise
 */
export async function isTokenRevoked(givenToken: string): Promise<Token | undefined> {
    return await db.query.tokens.findFirst({ where: eq(tokens.token, givenToken) });
}
