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

function readProfileClaims(claimSource: Readonly<Record<string, unknown>>): ProfileClaims {
    return {
        email: typeof claimSource["email"] === "string" ? claimSource["email"] : undefined,
        emailVerified: typeof claimSource["email_verified"] === "boolean" ? claimSource["email_verified"] : undefined,
        name: typeof claimSource["name"] === "string" ? claimSource["name"] : undefined,
        givenName: typeof claimSource["given_name"] === "string" ? claimSource["given_name"] : undefined,
        familyName: typeof claimSource["family_name"] === "string" ? claimSource["family_name"] : undefined,
    };
}

function hasMissingProfileClaim(profileClaims: ProfileClaims): boolean {
    return (
        profileClaims.email === undefined ||
        profileClaims.emailVerified === undefined ||
        profileClaims.name === undefined ||
        profileClaims.givenName === undefined ||
        profileClaims.familyName === undefined
    );
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

    const supportedAuthenticationMethods = serverMetadata.token_endpoint_auth_methods_supported;
    const useBasicAuthentication =
        supportedAuthenticationMethods === undefined || supportedAuthenticationMethods.includes("client_secret_basic");
    const clientAuthentication = useBasicAuthentication
        ? client.ClientSecretBasic(oidcConfig.clientSecret)
        : client.ClientSecretPost(oidcConfig.clientSecret);

    oidcClientConfig = new client.Configuration(
        serverMetadata,
        oidcConfig.clientId,
        oidcConfig.clientSecret,
        clientAuthentication
    );
    if (oidcConfig.allowHttp) {
        client.allowInsecureRequests(oidcClientConfig);
    }

    Logger.info(
        `OIDC token endpoint authentication method: ${useBasicAuthentication ? "client_secret_basic" : "client_secret_post"}`
    );
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
    if (hasMissingProfileClaim(profileClaims) && userInfoEndpoint !== undefined) {
        const userInfo = await client.fetchUserInfo(oidcClientConfig, tokenSet.access_token, idTokenClaims.sub);
        const userInfoClaims = readProfileClaims(userInfo);
        profileClaims = {
            email: userInfoClaims.email ?? profileClaims.email,
            emailVerified: userInfoClaims.emailVerified ?? profileClaims.emailVerified,
            name: userInfoClaims.name ?? profileClaims.name,
            givenName: userInfoClaims.givenName ?? profileClaims.givenName,
            familyName: userInfoClaims.familyName ?? profileClaims.familyName,
        };
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

export function buildLogoutUrl(): string | null {
    try {
        const url = client.buildEndSessionUrl(oidcClientConfig, {});
        return url.href;
    } catch {
        return null;
    }
}
