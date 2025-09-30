/**
 * Module that defines the controller functions
 * for the authentication routes.
 */
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import passport from "passport";
import { JWT_SECRET, originConfig, PASSPORT_STRATEGY } from "#config/config.js";
import { deleteExpiredTokens, isTokenRevoked, revokeToken } from "#services/revoked-tokens.service.js";
import { JWTError, UnauthorizedError } from "#errors/unauthorized.error.js";

const appOrigin = originConfig.app;

async function loadStrategy() {
    if (PASSPORT_STRATEGY === "azure") {
        await import("#services/azureAuthentication.service.js");
    } else if (PASSPORT_STRATEGY === "fixed") {
        await import("#services/fixedAuthentication.service.js");
    } else {
        throw new Error("No known authentication strategy selected");
    }
}

await loadStrategy();

let jwtSecure = true;
if (process.env["COOKIES_SECURE_OPTION"] === "disabled") {
    jwtSecure = false;
}

export async function authenticationMode(_request: Request, response: Response): Promise<void> {
    response.json({ authenticationMode: PASSPORT_STRATEGY ?? "azure" });
}

export async function getAuthStatus(request: Request, response: Response): Promise<void> {
    let decodedToken: JwtPayload;
    const authToken = request.cookies["accessToken"];
    if (!authToken) {
        response.status(200).json({
            data: {
                status: {
                    isLoggedIn: false,
                    isPrivileged: false,
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
                    isPrivileged: false,
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
            email: decodedToken["email"],
            status: {
                isLoggedIn: true,
                isPrivileged: decodedToken["isPrivileged"] === 1,
            },
        },
    });
}

export const authenticate = passport.authenticate(PASSPORT_STRATEGY, {
    failureRedirect: "/login?failure",
    session: false,
});

export function finalizeAuthentication(request: Request, response: Response): void {
    response.cookie("accessToken", request.user?.threatSeaToken, {
        httpOnly: true,
        secure: jwtSecure,
        sameSite: "strict",
    });
    response.redirect(`${appOrigin}`);
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
