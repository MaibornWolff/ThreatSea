import { ErrorResponse, ServerError } from "#errors/server.error.js";

export class ForbiddenError extends ServerError {
    constructor(message = "Forbidden", code: string | null = null) {
        super(403, "Forbidden", message, code);
    }

    override getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }
}

export class CSRFTokenError extends ForbiddenError {
    constructor() {
        super("Invalid CSRF-Token", "EINVALIDCSRFTOKEN");
    }

    override getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }
}
