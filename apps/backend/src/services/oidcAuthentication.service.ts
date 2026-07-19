import { oidcConfig } from "#config/config.js";
import { UnauthorizedError } from "#errors/unauthorized.error.js";
import { buildThreatSeaAccessToken, OidcProfile } from "#services/auth.service.js";
import { Logger } from "#logging/index.js";
import crypto from "crypto";
import * as client from "openid-client";

interface OidcLoginInitiation {
    redirectUrl: string;
    state: string;
    nonce: string;
    codeVerifier: string;
}

interface OidcCallbackParams {
    state: string;
    nonce: string;
    codeVerifier: string;
}

interface ProfileClaims {
    email?: string | undefined;
    emailVerified?: boolean | undefined;
    name?: string | undefined;
    givenName?: string | undefined;
    familyName?: string | undefined;
}

// Some IdPs (e.g. AWS Cognito) serialize email_verified as the string "true"/"false"
// rather than a JSON boolean; honour both while treating anything else as absent.
function parseEmailVerified(rawValue: unknown): boolean | undefined {
    if (rawValue === true || rawValue === "true") {
        return true;
    }
    if (rawValue === false || rawValue === "false") {
        return false;
    }
    return undefined;
}

function readProfileClaims(claimSource: Readonly<Record<string, unknown>>): ProfileClaims {
    return {
        email: typeof claimSource["email"] === "string" ? claimSource["email"] : undefined,
        emailVerified: parseEmailVerified(claimSource["email_verified"]),
        name: typeof claimSource["name"] === "string" ? claimSource["name"] : undefined,
        givenName: typeof claimSource["given_name"] === "string" ? claimSource["given_name"] : undefined,
        familyName: typeof claimSource["family_name"] === "string" ? claimSource["family_name"] : undefined,
    };
}

// Only email and email_verified drive authorization (the account-linking gate); the name parts are
// cosmetic. Gate the blocking userinfo round-trip on those two alone so an ID token that already
// vouches a verified email is trusted as-is — fetching userinfo just for a display name would risk
// dropping the verified flag (many IdPs assert it only in the ID token) and break legitimate logins.
function hasMissingRequiredClaim(profileClaims: ProfileClaims): boolean {
    return profileClaims.email === undefined || profileClaims.emailVerified === undefined;
}

function mergeProfileClaims(idTokenClaims: ProfileClaims, userInfoClaims: ProfileClaims): ProfileClaims {
    // email and email_verified must be taken as an atomic pair from a single source. Mixing an
    // (attacker-editable) userinfo email with the ID token's email_verified flag would let an
    // unverified address inherit a verified status and bypass the account-linking gate.
    const emailSource = userInfoClaims.email !== undefined ? userInfoClaims : idTokenClaims;
    return {
        email: emailSource.email,
        emailVerified: emailSource.emailVerified,
        name: userInfoClaims.name ?? idTokenClaims.name,
        givenName: userInfoClaims.givenName ?? idTokenClaims.givenName,
        familyName: userInfoClaims.familyName ?? idTokenClaims.familyName,
    };
}

let oidcClientConfig: client.Configuration;

export async function initializeOidc(): Promise<void> {
    if (!oidcConfig) {
        throw new Error("OIDC config not available");
    }

    const issuerUrl = new URL(oidcConfig.issuerUrl);
    const options: client.DiscoveryRequestOptions = {};
    if (oidcConfig.allowHttp) {
        options.execute = [client.allowInsecureRequests];
    }

    const discoveredConfig = await client.discovery(
        issuerUrl,
        oidcConfig.clientId,
        oidcConfig.clientSecret,
        undefined,
        options
    );
    const serverMetadata = discoveredConfig.serverMetadata();

    // Prefer client_secret_post — it was the effective default before this detection existed and
    // avoids the RFC 6749 secret percent-encoding pitfalls of Basic. Metadata that omits the field
    // is treated as post-capable (the OIDC default). Fall back to Basic only when post is not
    // advertised, and fail fast when the IdP supports neither secret-based method.
    const supportedAuthenticationMethods = serverMetadata.token_endpoint_auth_methods_supported;
    let clientAuthentication: ReturnType<typeof client.ClientSecretPost>;
    let selectedAuthenticationMethod: string;
    if (supportedAuthenticationMethods === undefined || supportedAuthenticationMethods.includes("client_secret_post")) {
        clientAuthentication = client.ClientSecretPost(oidcConfig.clientSecret);
        selectedAuthenticationMethod = "client_secret_post";
    } else if (supportedAuthenticationMethods.includes("client_secret_basic")) {
        clientAuthentication = client.ClientSecretBasic(oidcConfig.clientSecret);
        selectedAuthenticationMethod = "client_secret_basic";
    } else {
        throw new Error(
            `OIDC provider does not advertise a client-secret token endpoint authentication method (client_secret_post or client_secret_basic); advertised: ${supportedAuthenticationMethods.join(", ")}`
        );
    }

    oidcClientConfig = new client.Configuration(
        serverMetadata,
        oidcConfig.clientId,
        oidcConfig.clientSecret,
        clientAuthentication
    );
    if (oidcConfig.allowHttp) {
        client.allowInsecureRequests(oidcClientConfig);
    }

    Logger.info(`OIDC token endpoint authentication method: ${selectedAuthenticationMethod}`);
}

export async function buildLoginRedirectUrl(): Promise<OidcLoginInitiation> {
    if (!oidcConfig) {
        throw new Error("OIDC config not available");
    }

    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const codeVerifier = client.randomPKCECodeVerifier();
    const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);

    const parameters: Record<string, string> = {
        redirect_uri: oidcConfig.callbackURL,
        scope: oidcConfig.scope,
        response_type: "code",
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
    };

    const redirectTo = client.buildAuthorizationUrl(oidcClientConfig, parameters);

    return {
        redirectUrl: redirectTo.href,
        state,
        nonce,
        codeVerifier,
    };
}

export async function handleOidcCallback(callbackUrl: URL, oidcParams: OidcCallbackParams): Promise<string> {
    const { state, nonce, codeVerifier } = oidcParams;

    const tokenSet = await client.authorizationCodeGrant(oidcClientConfig, callbackUrl, {
        expectedState: state,
        expectedNonce: nonce,
        pkceCodeVerifier: codeVerifier,
    });

    const idTokenClaims = tokenSet.claims();
    if (!idTokenClaims?.sub) {
        throw new UnauthorizedError("No 'sub' claim found in ID token");
    }

    let profileClaims = readProfileClaims(idTokenClaims);

    const userInfoEndpoint = oidcClientConfig.serverMetadata().userinfo_endpoint;
    if (hasMissingRequiredClaim(profileClaims) && userInfoEndpoint !== undefined) {
        const userInfo = await client.fetchUserInfo(oidcClientConfig, tokenSet.access_token, idTokenClaims.sub);
        profileClaims = mergeProfileClaims(profileClaims, readProfileClaims(userInfo));
    }

    const user: OidcProfile = {
        sub: idTokenClaims.sub,
        email: profileClaims.email,
        emailVerified: profileClaims.emailVerified,
        displayName: profileClaims.name,
        firstName: profileClaims.givenName,
        lastName: profileClaims.familyName,
    };

    const threatSeaToken = await buildThreatSeaAccessToken(user);

    return threatSeaToken;
}
