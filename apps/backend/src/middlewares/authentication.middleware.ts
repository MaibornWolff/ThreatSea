import { JWT_SECRET, JWT_VERIFY_OPTIONS, originConfig } from "#config/config.js";
import jwt, { JsonWebTokenError, JwtPayload, NotBeforeError, TokenExpiredError } from "jsonwebtoken";
import { isTokenRevoked } from "#services/revoked-tokens.service.js";
import { JWTError, UnauthorizedError } from "#errors/unauthorized.error.js";
import { NextFunction, Request, Response } from "express";

/**
 * Middleware function to check if the user is authenticated
 * (in terms of providing a valid JWT token).
 *
 * @param request - The http request.
 * @param response - The http response.
 * @param next - The next middleware function.
 */
export async function CheckTokenHandler(request: Request, response: Response, next: NextFunction): Promise<void> {
    const authToken: string = request.cookies["accessToken"];
    if (!authToken) {
        next(new UnauthorizedError("No access token provided"));
        return;
    }

    let decodedToken: JwtPayload;
    try {
        decodedToken = jwt.verify(authToken, JWT_SECRET, JWT_VERIFY_OPTIONS) as JwtPayload;
    } catch (error) {
        next(new JWTError(error as TokenExpiredError | JsonWebTokenError | NotBeforeError));
        return;
    }

    const isRevoked = await isTokenRevoked(authToken);
    if (isRevoked) {
        next(new UnauthorizedError("Token is revoked"));
        return;
    }

    const userId = Number(decodedToken["userId"]);
    if (!Number.isInteger(userId) || userId <= 0) {
        next(new UnauthorizedError("Invalid token payload"));
        return;
    }
    request.user = { id: userId };
    response.header("Access-Control-Allow-Origin", originConfig.app);

    next();
}
