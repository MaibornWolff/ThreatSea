import { ErrorResponse, ServerError } from "#errors/server.error.js";
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from "jsonwebtoken";

export class UnauthorizedError extends ServerError {
    constructor(message = "Unauthorized", code: string | null = null) {
        super(401, "Unauthorized", message, code);
    }

    override getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }
}

export class JWTError extends UnauthorizedError {
    constructor(error: TokenExpiredError | JsonWebTokenError | NotBeforeError) {
        super(error.message, "EJWTERROR");
    }

    override getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }
}
