import { ErrorResponse, ServerError } from "#errors/server.error.js";

export class ConflictError extends ServerError {
    constructor(message = "Conflict", code: string | null = null) {
        super(409, "Conflict", message, code);
    }

    override getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }
}
