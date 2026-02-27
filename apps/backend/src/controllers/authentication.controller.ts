/**
 * Module that defines the controller functions
 * for the authentication routes.
 */
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET, originConfig, AUTH_METHOD } from "#config/config.js";
import { deleteExpiredTokens, isTokenRevoked, revokeToken } from "#services/revoked-tokens.service.js";
import { JWTError, UnauthorizedError } from "#errors/unauthorized.error.js";
import { Logger } from "#logging/index.js";

const appOrigin = originConfig.app;

let oidcService: typeof import("#services/oidcAuthentication.service.js") | null = null;
let fixedService: typeof import("#services/fixedAuthentication.service.js") | null = null;

async function loadStrategy() {
    if (AUTH_METHOD === "oidc") {
        oidcService = await import("#services/oidcAuthentication.service.js");
        await oidcService.initializeOidc();
    } else if (AUTH_METHOD === "fixed") {
        fixedService = await import("#services/fixedAuthentication.service.js");
    } else {
        throw new Error("No known authentication strategy selected"); // UnexpectedError, created by error middleware
    }
}

await loadStrategy();

let jwtSecure = true;
if (process.env["COOKIES_SECURE_OPTION"] === "disabled") {
    jwtSecure = false;
}

export async function authenticationMode(_request: Request, response: Response): Promise<void> {
    response.json({ authenticationMode: AUTH_METHOD });
}

export async function getAuthStatus(request: Request, response: Response): Promise<void> {
    let decodedToken: JwtPayload;
    const authToken = request.cookies["accessToken"];
    if (!authToken) {
        response.status(200).json({
            data: {
                status: {
                    isLoggedIn: false,
                },
            },
            message: "No token provided",
        });
        return;
    }

    try {
        decodedToken = jwt.verify(authToken, JWT_SECRET) as JwtPayload;

        const isRevoked = await isTokenRevoked(authToken);
        if (isRevoked) {
            throw new UnauthorizedError("Token is revoked");
        }
    } catch (error) {
        response.json({
            data: {
                status: {
                    isLoggedIn: false,
                },
            },
            message: (error as Error).message,
        });
        return;
    }

    response.status(200).json({
        data: {
            userId: decodedToken["userId"],
            firstname: decodedToken["firstname"],
            lastname: decodedToken["lastname"],
            displayName: decodedToken["displayName"],
            email: decodedToken["email"],
            status: {
                isLoggedIn: true,
            },
        },
    });
}

export async function authenticate(request: Request, response: Response): Promise<void> {
    try {
        if (AUTH_METHOD === "fixed" && fixedService) {
            const threatSeaToken = await fixedService.getFixedLoginToken(request.url);

            response.cookie("accessToken", threatSeaToken, {
                httpOnly: true,
                secure: jwtSecure,
                sameSite: "strict",
            });

            response.redirect(`${appOrigin}`);
            return;
        }

        if (!oidcService) {
            throw new Error("OIDC service not initialized");
        }

        const redirectUrl = oidcService.buildLoginRedirectUrl();
        response.redirect(redirectUrl);
    } catch (err) {
        if (err instanceof Error) {
            Logger.error("Authentication failed: " + err.message);
        }
        response.redirect(`${appOrigin}/login?failure`);
    }
}

export async function finalizeAuthentication(request: Request, response: Response): Promise<void> {
    try {
        if (!oidcService) {
            response.redirect(`${appOrigin}/login?failure`);
            return;
        }

        const callbackUrl = new URL(request.originalUrl, `${request.protocol}://${request.get("host")}`);
        const threatSeaToken = await oidcService.handleOidcCallback(callbackUrl);

        response.cookie("accessToken", threatSeaToken, {
            httpOnly: true,
            secure: jwtSecure,
            sameSite: "strict",
        });

        response.redirect(`${appOrigin}`);
    } catch (err) {
        if (err instanceof Error) {
            Logger.error("Authentication finalization failed: " + err.message);
        }
        response.redirect(`${appOrigin}/login?failure`);
    }
}

export async function logout(request: Request, response: Response, next: NextFunction): Promise<void> {
    const token = request.cookies["accessToken"];

    if (token) {
        let decodedToken: JwtPayload;
        try {
            decodedToken = jwt.verify(token, JWT_SECRET) as JwtPayload;
        } catch (error) {
            next(new JWTError(error as jwt.TokenExpiredError));
            return;
        }

        response.clearCookie("accessToken");

        await deleteExpiredTokens();
        await revokeToken(token, decodedToken.exp!);
    }

    response.status(204).end();
}
