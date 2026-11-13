/**
 * @module revoked-tokens.service - Module that manages all revoked tokens.
 */
import { eq, lt } from "drizzle-orm";
import { base64url } from "jose";
import { db } from "#db/index.js";
import { Token, tokens } from "#db/schema.js";

/**
 * Re-encodes the signature segment of a JWT in its canonical base64url form.
 * jose decodes signatures leniently (padding, unused trailing bits), so several strings verify as
 * the same token. Revocations must match on the decoded signature, not on the raw cookie value.
 *
 * @param {string} token whole accessToken
 * @returns {string} the token with a canonically encoded signature
 */
function toCanonicalToken(token: string): string {
    const [protectedHeader, payload, signature] = token.split(".");
    if (protectedHeader === undefined || payload === undefined || signature === undefined) {
        return token;
    }
    return `${protectedHeader}.${payload}.${base64url.encode(base64url.decode(signature))}`;
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
    const canonicalToken = toCanonicalToken(token);
    return await db.transaction(async (tx) => {
        const existingToken = await tx.query.tokens.findFirst({ where: eq(tokens.token, canonicalToken) });
        if (existingToken) {
            return existingToken;
        }

        return (
            await tx
                .insert(tokens)
                .values({
                    token: canonicalToken,
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
    return await db.query.tokens.findFirst({ where: eq(tokens.token, toCanonicalToken(givenToken)) });
}
