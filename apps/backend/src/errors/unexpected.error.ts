import { ErrorResponse, ErrorResponseBody, ServerError } from "#errors/server.error.js";
import { UUID } from "crypto";

/**
 * This error is thrown when an unexpected error occurs.
 * It should not be created manually to ensure a log id is created and set by the global error handler.
 * Instead, throw a normal Error, which will be caught and transformed by the global error handler.
 * The original message stays in the log only, because it can contain SQL, file paths or other internals.
 */
export class UnexpectedError extends ServerError {
    private readonly logId: UUID;

    constructor(logId: UUID) {
        super(500, "Unexpected", "Unexpected Error", null);
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
