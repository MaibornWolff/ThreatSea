/**
 * Module that defines tests for the revocation of access tokens on logout.
 */
import request from "supertest";
import { SignJWT } from "jose";
import { app } from "#server.js";
import { JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET, JWT_VERIFY_OPTIONS } from "#config/config.js";

// vitest.setup.ts mocks jwtVerify; the real one proves each re-encoded copy is a valid token.
const { jwtVerify: realJwtVerify } = await vi.importActual<typeof import("jose")>("jose");

const BASE64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

let csrfCookies: string[];
let csrfToken: string;

async function signAccessToken(email: string): Promise<string> {
    return await new SignJWT({ userId: 1, email })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .setIssuer(JWT_ISSUER)
        .setAudience(JWT_AUDIENCE)
        .sign(JWT_SECRET);
}

// An HS256 signature is 32 bytes, encoded as 43 base64url characters. The two lowest bits of the
// last character carry no data, so flipping them yields a different string with the same signature.
function flipUnusedSignatureBits(token: string, bitMask: number): string {
    const lastCharacterIndex = BASE64URL_ALPHABET.indexOf(token.at(-1)!);
    return token.slice(0, -1) + BASE64URL_ALPHABET[lastCharacterIndex ^ bitMask];
}

async function isLoggedInWith(accessToken: string): Promise<boolean> {
    const response = await request(app).get("/api/auth/status").set("Cookie", `accessToken=${accessToken}`);
    expect(response.statusCode).toEqual(200);
    return response.body.data.status.isLoggedIn;
}

async function logOut(accessToken: string): Promise<void> {
    const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set("X-CSRF-TOKEN", csrfToken)
        .set("Cookie", [...csrfCookies, `accessToken=${accessToken}`]);
    expect(logoutResponse.statusCode).toEqual(204);
}

beforeAll(async () => {
    const csrfResponse = await request(app).get("/api/csrf-token");
    expect(csrfResponse.status).toBe(200);
    csrfToken = csrfResponse.body.token;
    const setCookieHeader = csrfResponse.headers["set-cookie"];
    csrfCookies = setCookieHeader !== undefined ? [setCookieHeader] : [];
});

describe("revoked access tokens", () => {
    let revokedToken: string;

    beforeAll(async () => {
        revokedToken = await signAccessToken("revoked@example.com");
        await logOut(revokedToken);
    });

    it("rejects the token that was logged out", async () => {
        expect(await isLoggedInWith(revokedToken)).toBe(false);
    });

    it.each([
        ["flipped lowest unused bit", (token: string) => flipUnusedSignatureBits(token, 0b01)],
        ["flipped second unused bit", (token: string) => flipUnusedSignatureBits(token, 0b10)],
        ["appended padding", (token: string) => `${token}=`],
    ])("rejects a re-encoded copy of the logged out token (%s)", async (_variantName, reencode) => {
        const reencodedToken = reencode(revokedToken);
        expect(reencodedToken).not.toEqual(revokedToken);
        const { payload } = await realJwtVerify(reencodedToken, JWT_SECRET, JWT_VERIFY_OPTIONS);
        expect(payload["email"]).toEqual("revoked@example.com");

        expect(await isLoggedInWith(reencodedToken)).toBe(false);

        const projectsResponse = await request(app).get("/api/projects").set("Cookie", `accessToken=${reencodedToken}`);
        expect(projectsResponse.statusCode).toEqual(401);
        expect(projectsResponse.body.message).toEqual("Token is revoked");
    });

    it("keeps other tokens valid", async () => {
        const otherToken = await signAccessToken("still-logged-in@example.com");

        expect(await isLoggedInWith(otherToken)).toBe(true);
    });
});

describe("logging out with a re-encoded token", () => {
    it("revokes the original token and every other encoding of it", async () => {
        const originalToken = await signAccessToken("reencoded-logout@example.com");

        await logOut(flipUnusedSignatureBits(originalToken, 0b01));

        expect(await isLoggedInWith(originalToken)).toBe(false);
        expect(await isLoggedInWith(flipUnusedSignatureBits(originalToken, 0b10))).toBe(false);
        expect(await isLoggedInWith(`${originalToken}=`)).toBe(false);
    });
});
