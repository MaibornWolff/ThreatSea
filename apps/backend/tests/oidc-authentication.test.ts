import * as client from "openid-client";
import { buildThreatSeaAccessToken } from "#services/auth.service.js";
import { handleOidcCallback, initializeOidc } from "#services/oidcAuthentication.service.js";
import { UnauthorizedError } from "#errors/unauthorized.error.js";

vi.mock("openid-client", () => ({
    discovery: vi.fn(),
    authorizationCodeGrant: vi.fn(),
    fetchUserInfo: vi.fn(),
    buildAuthorizationUrl: vi.fn(),
    randomPKCECodeVerifier: vi.fn(),
    calculatePKCECodeChallenge: vi.fn(),
    allowInsecureRequests: vi.fn(),
    ClientSecretBasic: vi.fn(),
    ClientSecretPost: vi.fn(),
    Configuration: vi.fn(),
}));

vi.mock("#services/auth.service.js", () => ({
    buildThreatSeaAccessToken: vi.fn(),
}));

vi.mock("#config/config.js", async (importOriginal) => {
    const actualConfig = await importOriginal<typeof import("#config/config.js")>();
    return {
        ...actualConfig,
        oidcConfig: {
            clientId: "threatsea-client",
            clientSecret: "threatsea-secret",
            issuerUrl: "https://idp.example.com",
            callbackURL: "http://localhost:8000/api/auth/redirect",
            scope: "openid profile email",
            allowHttp: false,
        },
    };
});

interface TestServerMetadata {
    issuer: string;
    token_endpoint_auth_methods_supported?: string[];
    userinfo_endpoint?: string;
}

async function initializeOidcWithServerMetadata(serverMetadata: TestServerMetadata): Promise<void> {
    vi.mocked(client.discovery).mockResolvedValue({
        serverMetadata: () => serverMetadata,
    } as never);
    vi.mocked(client.Configuration).mockImplementation(function (metadata: unknown) {
        return { serverMetadata: () => metadata };
    } as never);
    await initializeOidc();
}

function mockAuthorizationCodeGrant(idTokenClaims: Record<string, unknown> | undefined): void {
    vi.mocked(client.authorizationCodeGrant).mockResolvedValue({
        access_token: "idp-access-token",
        claims: () => idTokenClaims,
    } as never);
}

const callbackUrl = new URL("http://localhost:8000/api/auth/redirect?code=abc&state=state-1");
const callbackParameters = { state: "state-1", nonce: "nonce-1", codeVerifier: "verifier-1" };

describe("handleOidcCallback profile building", () => {
    it("builds the profile from ID token claims without calling userinfo", async () => {
        await initializeOidcWithServerMetadata({
            issuer: "https://idp.example.com",
            userinfo_endpoint: "https://idp.example.com/userinfo",
        });
        mockAuthorizationCodeGrant({
            sub: "subject-1",
            email: "user@example.com",
            email_verified: true,
            name: "User Example",
            given_name: "User",
            family_name: "Example",
        });
        vi.mocked(buildThreatSeaAccessToken).mockResolvedValue("threatsea-token");

        const threatSeaToken = await handleOidcCallback(callbackUrl, callbackParameters);

        expect(threatSeaToken).toBe("threatsea-token");
        expect(client.fetchUserInfo).not.toHaveBeenCalled();
        expect(buildThreatSeaAccessToken).toHaveBeenCalledWith({
            sub: "subject-1",
            email: "user@example.com",
            emailVerified: true,
            displayName: "User Example",
            firstName: "User",
            lastName: "Example",
        });
    });

    it("falls back to userinfo when a claim is missing and the endpoint exists", async () => {
        await initializeOidcWithServerMetadata({
            issuer: "https://idp.example.com",
            userinfo_endpoint: "https://idp.example.com/userinfo",
        });
        mockAuthorizationCodeGrant({ sub: "subject-1", email: "stale@example.com" });
        vi.mocked(client.fetchUserInfo).mockResolvedValue({
            sub: "subject-1",
            email: "fresh@example.com",
            email_verified: true,
            name: "Fresh Name",
            given_name: "Fresh",
            family_name: "Name",
        } as never);
        vi.mocked(buildThreatSeaAccessToken).mockResolvedValue("threatsea-token");

        await handleOidcCallback(callbackUrl, callbackParameters);

        expect(client.fetchUserInfo).toHaveBeenCalledWith(expect.anything(), "idp-access-token", "subject-1");
        expect(buildThreatSeaAccessToken).toHaveBeenCalledWith({
            sub: "subject-1",
            email: "fresh@example.com",
            emailVerified: true,
            displayName: "Fresh Name",
            firstName: "Fresh",
            lastName: "Name",
        });
    });

    it("skips userinfo when the metadata has no userinfo endpoint", async () => {
        await initializeOidcWithServerMetadata({ issuer: "https://idp.example.com" });
        mockAuthorizationCodeGrant({ sub: "subject-1", email: "user@example.com", email_verified: true });
        vi.mocked(buildThreatSeaAccessToken).mockResolvedValue("threatsea-token");

        const threatSeaToken = await handleOidcCallback(callbackUrl, callbackParameters);

        expect(threatSeaToken).toBe("threatsea-token");
        expect(client.fetchUserInfo).not.toHaveBeenCalled();
        expect(buildThreatSeaAccessToken).toHaveBeenCalledWith({
            sub: "subject-1",
            email: "user@example.com",
            emailVerified: true,
            displayName: undefined,
            firstName: undefined,
            lastName: undefined,
        });
    });

    it("rejects a token response without a sub claim", async () => {
        await initializeOidcWithServerMetadata({ issuer: "https://idp.example.com" });
        mockAuthorizationCodeGrant(undefined);

        await expect(handleOidcCallback(callbackUrl, callbackParameters)).rejects.toThrow(UnauthorizedError);
        expect(buildThreatSeaAccessToken).not.toHaveBeenCalled();
    });

    it("keeps the ID token's verified email and skips userinfo when only a name claim is missing", async () => {
        await initializeOidcWithServerMetadata({
            issuer: "https://idp.example.com",
            userinfo_endpoint: "https://idp.example.com/userinfo",
        });
        // ID token already carries a verified email but omits family_name — a common IdP shape where
        // names live only in userinfo. Fetching userinfo here would drop the verified flag (userinfo
        // rarely re-asserts email_verified) and break linking for a genuinely-verified user.
        mockAuthorizationCodeGrant({
            sub: "subject-1",
            email: "alice@example.com",
            email_verified: true,
            given_name: "Alice",
        });
        // If userinfo were (wrongly) consulted, it would swap in a different email with no verification.
        vi.mocked(client.fetchUserInfo).mockResolvedValue({
            sub: "subject-1",
            email: "attacker@example.com",
            family_name: "Smith",
        } as never);
        vi.mocked(buildThreatSeaAccessToken).mockResolvedValue("threatsea-token");

        await handleOidcCallback(callbackUrl, callbackParameters);

        expect(client.fetchUserInfo).not.toHaveBeenCalled();
        expect(buildThreatSeaAccessToken).toHaveBeenCalledWith(
            expect.objectContaining({ email: "alice@example.com", emailVerified: true })
        );
    });

    it("takes email and email_verified as an atomic pair from userinfo when the ID token omits verification", async () => {
        await initializeOidcWithServerMetadata({
            issuer: "https://idp.example.com",
            userinfo_endpoint: "https://idp.example.com/userinfo",
        });
        // ID token has an email but no email_verified, so userinfo must be consulted. Its email and
        // verification flag are taken together — never a userinfo email with a foreign verified flag.
        mockAuthorizationCodeGrant({ sub: "subject-1", email: "stale@example.com" });
        vi.mocked(client.fetchUserInfo).mockResolvedValue({
            sub: "subject-1",
            email: "attacker@example.com",
            given_name: "Attacker",
        } as never);
        vi.mocked(buildThreatSeaAccessToken).mockResolvedValue("threatsea-token");

        await handleOidcCallback(callbackUrl, callbackParameters);

        expect(client.fetchUserInfo).toHaveBeenCalled();
        expect(buildThreatSeaAccessToken).toHaveBeenCalledWith(
            expect.objectContaining({ email: "attacker@example.com", emailVerified: undefined })
        );
    });

    it("treats a string email_verified claim as verified", async () => {
        await initializeOidcWithServerMetadata({ issuer: "https://idp.example.com" });
        mockAuthorizationCodeGrant({
            sub: "subject-1",
            email: "user@example.com",
            email_verified: "true",
            name: "User Example",
            given_name: "User",
            family_name: "Example",
        });
        vi.mocked(buildThreatSeaAccessToken).mockResolvedValue("threatsea-token");

        await handleOidcCallback(callbackUrl, callbackParameters);

        expect(client.fetchUserInfo).not.toHaveBeenCalled();
        expect(buildThreatSeaAccessToken).toHaveBeenCalledWith(expect.objectContaining({ emailVerified: true }));
    });
});

describe("initializeOidc client authentication detection", () => {
    it("reuses the discovered configuration for client_secret_post without rebuilding", async () => {
        await initializeOidcWithServerMetadata({
            issuer: "https://idp.example.com",
            token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
        });

        // discovery() already returns a Configuration defaulting to ClientSecretPost, so the post path
        // must reuse it rather than re-selecting the auth method or constructing a second Configuration.
        expect(client.ClientSecretBasic).not.toHaveBeenCalled();
        expect(client.ClientSecretPost).not.toHaveBeenCalled();
        expect(client.Configuration).not.toHaveBeenCalled();
    });

    it("reuses the discovered configuration when the metadata field is absent", async () => {
        await initializeOidcWithServerMetadata({ issuer: "https://idp.example.com" });

        expect(client.ClientSecretPost).not.toHaveBeenCalled();
        expect(client.ClientSecretBasic).not.toHaveBeenCalled();
        expect(client.Configuration).not.toHaveBeenCalled();
    });

    it("reuses the discovered configuration when the IdP only supports post", async () => {
        await initializeOidcWithServerMetadata({
            issuer: "https://idp.example.com",
            token_endpoint_auth_methods_supported: ["client_secret_post"],
        });

        expect(client.ClientSecretBasic).not.toHaveBeenCalled();
        expect(client.ClientSecretPost).not.toHaveBeenCalled();
        expect(client.Configuration).not.toHaveBeenCalled();
    });

    it("rebuilds the configuration with client_secret_basic when the IdP only supports basic", async () => {
        const basicAuthentication = { method: "client_secret_basic" };
        vi.mocked(client.ClientSecretBasic).mockReturnValue(basicAuthentication as never);

        await initializeOidcWithServerMetadata({
            issuer: "https://idp.example.com",
            token_endpoint_auth_methods_supported: ["client_secret_basic"],
        });

        expect(client.ClientSecretPost).not.toHaveBeenCalled();
        expect(client.ClientSecretBasic).toHaveBeenCalledWith("threatsea-secret");
        expect(client.Configuration).toHaveBeenCalledWith(
            expect.objectContaining({ issuer: "https://idp.example.com" }),
            "threatsea-client",
            "threatsea-secret",
            basicAuthentication
        );
    });

    it("throws when the IdP supports no client-secret authentication method", async () => {
        await expect(
            initializeOidcWithServerMetadata({
                issuer: "https://idp.example.com",
                token_endpoint_auth_methods_supported: ["private_key_jwt"],
            })
        ).rejects.toThrow(/client-secret/);

        expect(client.ClientSecretPost).not.toHaveBeenCalled();
        expect(client.ClientSecretBasic).not.toHaveBeenCalled();
        expect(client.Configuration).not.toHaveBeenCalled();
    });
});
