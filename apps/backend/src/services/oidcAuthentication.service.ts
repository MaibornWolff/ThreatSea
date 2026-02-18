import * as client from "openid-client";
import crypto from "crypto";
import { oidcConfig } from "#config/config.js";
import { buildThreatSeaAccessToken, OidcProfile } from "#services/auth.service.js";

interface IdTokenClaims {
    sub: string;
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    [key: string]: unknown;
}

let oidcClientConfig: client.Configuration;

const pendingLogins = new Map<string, { nonce: string }>();

export async function initializeOidc(): Promise<void> {
    const issuerUrl = new URL(oidcConfig.issuerUrl);
    const options: client.DiscoveryRequestOptions = {};
    if (issuerUrl.protocol === "http:") {
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

export function buildLoginRedirectUrl(): string {
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    pendingLogins.set(state, { nonce });

    setTimeout(() => pendingLogins.delete(state), 10 * 60 * 1000);

    const parameters: Record<string, string> = {
        redirect_uri: oidcConfig.callbackURL,
        scope: oidcConfig.scope,
        response_type: "code",
        state,
        nonce,
    };

    const redirectTo = client.buildAuthorizationUrl(oidcClientConfig, parameters);

    return redirectTo.href;
}

export async function handleOidcCallback(callbackUrl: URL): Promise<string> {
    const state = callbackUrl.searchParams.get("state");
    if (!state || !pendingLogins.has(state)) {
        throw new Error("Invalid or expired state parameter");
    }

    const { nonce } = pendingLogins.get(state)!;
    pendingLogins.delete(state);

    const tokenSet = await client.authorizationCodeGrant(oidcClientConfig, callbackUrl, {
        expectedState: state,
        expectedNonce: nonce,
    });

    const user = buildUserProfile(tokenSet);

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

function buildUserProfile(tokenSet: client.TokenEndpointResponse): OidcProfile {
    const idToken = tokenSet.id_token;
    if (!idToken) {
        throw new Error("No ID token in response");
    }

    const parts = idToken.split(".");
    if (parts.length < 3) {
        throw new Error("Invalid id_token format");
    }

    const payloadBase64 = parts[1] as string;
    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const claims: IdTokenClaims = JSON.parse(payloadJson);

    if (!claims.sub) {
        throw new Error("No 'sub' claim found in ID token");
    }

    return {
        sub: claims.sub,
        email: claims.email,
        displayName: claims.name,
        firstName: claims.given_name,
        lastName: claims.family_name,
    };
}
