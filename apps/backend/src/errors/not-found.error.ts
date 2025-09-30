import { ErrorResponse, ServerError } from "#errors/server.error.js";

export class NotFoundError extends ServerError {
    constructor(message = "Not Found", code: string | null = null) {
        super(404, "Not Found", message, code);
    }

    override getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }
}
