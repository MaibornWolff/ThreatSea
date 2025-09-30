import { ErrorResponse, ErrorResponseBody, ServerError } from "#errors/server.error.js";
import { UUID } from "crypto";

/**
 * This error is thrown when an unexpected error occurs.
 * It should not be created manually to ensure a log id is created and set by the global error handler.
 * Instead, throw a normal Error, which will be caught and transformed by the global error handler.
 */
export class UnexpectedError extends ServerError {
    private readonly logId: UUID;

    constructor(error: Error, logId: UUID) {
        const message = error.message || "Unexpected Error";
        super(500, "Unexpected", message, null);
        this.logId = logId;
    }

    override getErrorResponse(): ErrorResponse {
        const body: UnexpectedErrorResponseBody = {
            message: this.message,
            logId: this.logId,
        };
        return this.buildErrorResponse(body);
    }
}

interface UnexpectedErrorResponseBody extends ErrorResponseBody {
    logId: UUID;
}
