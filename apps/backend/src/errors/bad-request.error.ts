import { ErrorResponse, ErrorResponseBody, ServerError } from "#errors/server.error.js";
import { formatValidationErrors } from "#middlewares/input-validations/validator-messages.js";
import { ValidationError } from "class-validator";

export class BadRequestError extends ServerError {
    constructor(message = "Bad Request", code: string | null = null) {
        super(400, "Bad Request", message, code);
    }

    override getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }
}

export class InputValidationError extends BadRequestError {
    private readonly validationErrors: string[];

    constructor(validationErrors: ValidationError[]) {
        super("Validation Error", "EINPUTVALIDATION");
        this.validationErrors = formatValidationErrors(validationErrors);
    }

    override getErrorResponse(): ErrorResponse {
        const body: InputValidationErrorResponseBody = {
            message: this.message,
            validationErrors: this.validationErrors,
        };
        return this.buildErrorResponse(body);
    }
}

interface InputValidationErrorResponseBody extends ErrorResponseBody {
    validationErrors: string[];
}
