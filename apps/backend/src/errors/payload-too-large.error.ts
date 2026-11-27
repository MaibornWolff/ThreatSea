import { ErrorResponse, ServerError } from "#errors/server.error.js";

export class PayloadTooLargeError extends ServerError {
    constructor(message = "Payload Too Large", code: string | null = null) {
        super(413, "Payload Too Large", message, code);
    }

    override getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }
}
