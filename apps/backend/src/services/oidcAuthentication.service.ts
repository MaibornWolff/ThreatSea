import { oidcConfig } from "#config/config.js";
import { UnauthorizedError } from "#errors/unauthorized.error.js";
import { buildThreatSeaAccessToken, findOidcUserBySub, OidcProfile } from "#services/auth.service.js";
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

// Treat empty or whitespace-only string claims as absent. Some IdPs (e.g. Azure AD guest accounts)
// send given_name: "" — passing that through would coalesce to "" and overwrite a stored real name,
// the same clobber class commit a1a01878 fixed for undefined.
function readStringClaim(rawValue: unknown): string | undefined {
    if (typeof rawValue !== "string") {
        return undefined;
    }
    const trimmed = rawValue.trim();
    return trimmed === "" ? undefined : trimmed;
}

function readProfileClaims(claimSource: Readonly<Record<string, unknown>>): ProfileClaims {
    return {
        email: readStringClaim(claimSource["email"]),
        emailVerified: parseEmailVerified(claimSource["email_verified"]),
        name: readStringClaim(claimSource["name"]),
        givenName: readStringClaim(claimSource["given_name"]),
        familyName: readStringClaim(claimSource["family_name"]),
    };
}

// Any wanted field the ID token omits is worth enriching from userinfo. The fetch itself is
// separately gated on DB state (unknown-or-stale user) so this wide trigger doesn't cause a
// userinfo round-trip on every login.
function hasMissingProfileClaim(profileClaims: ProfileClaims): boolean {
    return (
        profileClaims.email === undefined ||
        profileClaims.emailVerified === undefined ||
        profileClaims.name === undefined ||
        profileClaims.givenName === undefined ||
        profileClaims.familyName === undefined
    );
}

const PROFILE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // equals 24 hours

function isProfileStale(profileSyncedAt: string | null): boolean {
    if (profileSyncedAt === null) {
        return true;
    }
    return Date.now() - new Date(profileSyncedAt).getTime() > PROFILE_REFRESH_INTERVAL_MS;
}

function mergeProfileClaims(idTokenClaims: ProfileClaims, userInfoClaims: ProfileClaims): ProfileClaims {
    // email and email_verified must be taken as an atomic pair from a single source. Mixing an
    // (attacker-editable) userinfo email with the ID token's email_verified flag would let an
    // unverified address inherit a verified status and bypass the account-linking gate.
    const emailSource = userInfoClaims.email !== undefined ? userInfoClaims : idTokenClaims;
    // Exception: when both sources assert the *same* address, the signed ID token is the
    // authoritative assertion for this authentication event and takes precedence over the
    // userinfo body, falling back to userinfo only when the ID token omits it.
    const emailsMatch =
        userInfoClaims.email !== undefined &&
        idTokenClaims.email !== undefined &&
        userInfoClaims.email.toLowerCase() === idTokenClaims.email.toLowerCase();
    return {
        email: emailSource.email,
        emailVerified: emailsMatch
            ? (idTokenClaims.emailVerified ?? userInfoClaims.emailVerified)
            : emailSource.emailVerified,
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
    let selectedAuthenticationMethod: string;
    if (supportedAuthenticationMethods === undefined || supportedAuthenticationMethods.includes("client_secret_post")) {
        // discovery() already defaults to ClientSecretPost and, when allowHttp is set, applied
        // allowInsecureRequests via options.execute — so the discovered Configuration is ready to
        // reuse as-is. Rebuilding it would duplicate both the auth selection and the insecure-request
        // opt-in and risk the two construction paths drifting apart.
        oidcClientConfig = discoveredConfig;
        selectedAuthenticationMethod = "client_secret_post";
    } else if (supportedAuthenticationMethods.includes("client_secret_basic")) {
        // Only the Basic fallback needs a rebuilt Configuration to override discovery()'s post default.
        oidcClientConfig = new client.Configuration(
            serverMetadata,
            oidcConfig.clientId,
            oidcConfig.clientSecret,
            client.ClientSecretBasic(oidcConfig.clientSecret)
        );
        if (oidcConfig.allowHttp) {
            client.allowInsecureRequests(oidcClientConfig);
        }
        selectedAuthenticationMethod = "client_secret_basic";
    } else {
        throw new Error(
            `OIDC provider does not advertise a client-secret token endpoint authentication method (client_secret_post or client_secret_basic); advertised: ${supportedAuthenticationMethods.join(", ")}`
        );
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
    let profileSynced = false;

    const userInfoEndpoint = oidcClientConfig.serverMetadata().userinfo_endpoint;
    if (userInfoEndpoint !== undefined && hasMissingProfileClaim(profileClaims)) {
        // Email is mandatory to mint a token, so a missing email forces a fetch regardless of
        // freshness — otherwise a repeat login inside the refresh window would skip userinfo, leave
        // email undefined, and hard-fail token minting (at most one successful login per refresh
        // window for IdPs that deliver email only via userinfo). Only the optional enrichment
        // claims (names, email_verified) defer to the unknown-or-stale gate.
        let shouldFetch = profileClaims.email === undefined;
        if (!shouldFetch) {
            const knownUser = await findOidcUserBySub(idTokenClaims.sub);
            shouldFetch = knownUser === undefined || isProfileStale(knownUser.profileSyncedAt);
        }
        if (shouldFetch) {
            const userInfo = await client.fetchUserInfo(oidcClientConfig, tokenSet.access_token, idTokenClaims.sub);
            profileClaims = mergeProfileClaims(profileClaims, readProfileClaims(userInfo));
            profileSynced = true;
        }
    }

    const user: OidcProfile = {
        sub: idTokenClaims.sub,
        email: profileClaims.email,
        emailVerified: profileClaims.emailVerified,
        displayName: profileClaims.name,
        firstName: profileClaims.givenName,
        lastName: profileClaims.familyName,
        profileSynced,
    };

    const threatSeaToken = await buildThreatSeaAccessToken(user);

    return threatSeaToken;
}
