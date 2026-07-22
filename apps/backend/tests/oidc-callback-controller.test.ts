import { Request, Response } from "express";
import { originConfig } from "#config/config.js";
import { finalizeAuthentication } from "#controllers/authentication.controller.js";
import { handleOidcCallback } from "#services/oidcAuthentication.service.js";

vi.mock("#config/config.js", async (importOriginal) => {
    const actualConfig = await importOriginal<typeof import("#config/config.js")>();
    return {
        ...actualConfig,
        AUTH_METHOD: "oidc",
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

vi.mock("#services/oidcAuthentication.service.js", () => ({
    initializeOidc: vi.fn(),
    buildLoginRedirectUrl: vi.fn(),
    handleOidcCallback: vi.fn(),
}));

function buildCallbackRequest(): Request {
    const session: Record<string, unknown> = {
        oidc: { state: "state-1", nonce: "nonce-1", codeVerifier: "verifier-1" },
        regenerate(callback: (error: Error | null) => void) {
            // Mirror express-session: regenerating drops the old session and its pending oidc data.
            delete session["oidc"];
            callback(null);
        },
    };
    return {
        session,
        originalUrl: "/api/auth/redirect?code=abc&state=state-1",
        cookies: {},
    } as unknown as Request;
}

function buildCallbackResponse(): Response {
    return {
        redirect: vi.fn(),
        cookie: vi.fn(),
    } as unknown as Response;
}

describe("finalizeAuthentication session cleanup", () => {
    it("preserves the oidc transaction when the callback fails so the genuine redirect can retry", async () => {
        vi.mocked(handleOidcCallback).mockRejectedValue(new Error("token exchange failed"));
        const request = buildCallbackRequest();
        const response = buildCallbackResponse();

        await finalizeAuthentication(request, response);

        expect(request.session.oidc).toEqual({ state: "state-1", nonce: "nonce-1", codeVerifier: "verifier-1" });
        expect(response.redirect).toHaveBeenCalledWith(`${originConfig.app}/login?failure`);
        expect(response.cookie).not.toHaveBeenCalled();
    });

    it("regenerates the session only after a successful exchange", async () => {
        const callOrder: string[] = [];
        vi.mocked(handleOidcCallback).mockImplementation(async () => {
            callOrder.push("exchange");
            return "threatsea-token";
        });
        const request = buildCallbackRequest();
        (request.session as unknown as { regenerate: (callback: (error: Error | null) => void) => void }).regenerate = (
            callback
        ) => {
            callOrder.push("regenerate");
            delete (request.session as unknown as Record<string, unknown>)["oidc"];
            callback(null);
        };
        const response = buildCallbackResponse();

        await finalizeAuthentication(request, response);

        expect(callOrder).toEqual(["exchange", "regenerate"]);
    });

    it("clears the oidc transaction and issues the cookie on success", async () => {
        vi.mocked(handleOidcCallback).mockResolvedValue("threatsea-token");
        const request = buildCallbackRequest();
        const response = buildCallbackResponse();

        await finalizeAuthentication(request, response);

        expect(request.session.oidc).toBeUndefined();
        expect(handleOidcCallback).toHaveBeenCalledWith(expect.any(URL), {
            state: "state-1",
            nonce: "nonce-1",
            codeVerifier: "verifier-1",
        });
        expect(response.cookie).toHaveBeenCalledWith(
            "accessToken",
            "threatsea-token",
            expect.objectContaining({ httpOnly: true })
        );
        expect(response.redirect).toHaveBeenCalledWith(originConfig.app);
    });
});
