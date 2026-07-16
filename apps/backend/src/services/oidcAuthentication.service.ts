import { oidcConfig } from "#config/config.js";
import { UnauthorizedError } from "#errors/unauthorized.error.js";
import { buildThreatSeaAccessToken, OidcProfile } from "#services/auth.service.js";
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

    oidcClientConfig = await client.discovery(
        issuerUrl,
        oidcConfig.clientId,
        oidcConfig.clientSecret,
        undefined,
        options
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

export async function handleOidcCallback(
    callbackUrl: URL,
    oidcParams: OidcCallbackParams
): Promise<{ threatSeaToken: string; refreshToken: string | undefined }> {
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

    const accessToken = tokenSet.access_token;
    const userInfo = await client.fetchUserInfo(oidcClientConfig, accessToken, idTokenClaims.sub);

    const user: OidcProfile = {
        sub: idTokenClaims.sub,
        email: userInfo.email,
        displayName: userInfo.name,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
    };

    const threatSeaToken = await buildThreatSeaAccessToken(user);

    return { threatSeaToken, refreshToken: tokenSet.refresh_token };
}

/**
 * Uses the stored OIDC refresh token to silently obtain new tokens from the
 * identity provider. Returns the rotated refresh token if the IdP issued one.
 */
export async function refreshOidcSession(refreshToken: string): Promise<string | undefined> {
    const tokenSet = await client.refreshTokenGrant(oidcClientConfig, refreshToken);
    return tokenSet.refresh_token;
}

export function buildLogoutUrl(): string | null {
    try {
        const url = client.buildEndSessionUrl(oidcClientConfig, {});
        return url.href;
    } catch {
        return null;
    }
}
