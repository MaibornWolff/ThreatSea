import * as client from "openid-client";
import crypto from "crypto";
import { oidcConfig } from "#config/config.js";
import { Logger } from "#logging/index.js";
import { buildThreatSeaAccessToken, OidcProfile } from "#services/auth.service.js";

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════
interface IdTokenClaims {
    sub: string;
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════
let oidcClientConfig: client.Configuration;

// Speichert state → nonce Zuordnung für laufende Login-Versuche
const pendingLogins = new Map<string, { nonce: string }>();

// ═══════════════════════════════════════════════════════════
// Initialisierung – einmalig beim App-Start
// ═══════════════════════════════════════════════════════════
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

    Logger.info(`OIDC Discovery erfolgreich: ${oidcConfig.issuerUrl}`);
}

// ═══════════════════════════════════════════════════════════
// Login – baut die Redirect-URL zum IdP
// ═══════════════════════════════════════════════════════════
export function buildLoginRedirectUrl(): string {
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    pendingLogins.set(state, { nonce });

    // Aufräumen nach 10 Minuten falls User Login abbricht
    setTimeout(() => pendingLogins.delete(state), 10 * 60 * 1000);

    // Laut Doku: PKCE nur wenn Server es unterstützt,
    // du wolltest ohne PKCE → wir nutzen nur state + nonce
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

// ═══════════════════════════════════════════════════════════
// Callback – verarbeitet die IdP-Antwort, baut ThreatSea-Token
// ═══════════════════════════════════════════════════════════
export async function handleOidcCallback(callbackUrl: URL): Promise<string> {
    // 1. State validieren
    const state = callbackUrl.searchParams.get("state");
    if (!state || !pendingLogins.has(state)) {
        throw new Error("Invalid or expired state parameter");
    }

    const { nonce } = pendingLogins.get(state)!;
    pendingLogins.delete(state);

    // 2. Authorization Code gegen Tokens tauschen
    const tokenSet = await client.authorizationCodeGrant(oidcClientConfig, callbackUrl, {
        expectedState: state,
        expectedNonce: nonce,
    });

    Logger.info("OIDC Token exchange erfolgreich");

    // 3. User-Profil aus ID-Token Claims bauen
    const user = buildUserProfile(tokenSet);

    // 4. ThreatSea Access Token bauen (gleiche Logik wie vorher)
    const threatSeaToken = await buildThreatSeaAccessToken(user);

    return threatSeaToken;
}

// ═══════════════════════════════════════════════════════════
// Logout-URL bauen (optional, falls IdP es unterstützt)
// ═══════════════════════════════════════════════════════════
export function buildLogoutUrl(): string | null {
    try {
        const url = client.buildEndSessionUrl(oidcClientConfig, {});
        return url.href;
    } catch {
        return null;
    }
}

// ═══════════════════════════════════════════════════════════
// Hilfsfunktion: TokenSet → OidcProfile
// ═══════════════════════════════════════════════════════════
function buildUserProfile(tokenSet: client.TokenEndpointResponse): OidcProfile {
    const idToken = tokenSet.id_token;
    if (!idToken) {
        throw new Error("No ID token in response");
    }

    const parts = idToken.split(".");
    if (parts.length < 3) {
        throw new Error("Invalid id_token format");
    }

    // ID-Token ist ein JWT mit 3 Teilen: header.payload.signature
    // openid-client hat die Signatur bereits bei authorizationCodeGrant validiert
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
