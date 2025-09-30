import type { NextFunction, Request, Response } from "express";
import { ServerError } from "#errors/server.error.js";
import { Logger } from "#logging/index.js";
import { UnexpectedError } from "#errors/unexpected.error.js";
import { CSRFTokenError } from "#errors/forbidden.error.js";

/**
 * Middleware function that will be called by default
 * when an error is provided to a next function call.
 *
 * @param error - The error provided to the next function call.
 * @param _request - The http request.
 * @param response - The http response.
 * @param _next - The next middleware function.
 */
export function ErrorHandler(error: Error, _request: Request, response: Response, _next: NextFunction): void {
    const serverError = createServerError(error);

    const errorResponse = serverError.getErrorResponse();
    response.status(errorResponse.status).json(errorResponse.body);
}

function createServerError(error: Error): ServerError {
    if (isErrorWithCode(error) && error.code === "EBADCSRFTOKEN") {
        return new CSRFTokenError();
    }

    if (!(error instanceof ServerError)) {
        const logId = Logger.error(`Unexpected Error:\n${(error as Error).message}\n${(error as Error).stack}`)!;
        return new UnexpectedError(error, logId);
    }

    return error;
}

function isErrorWithCode(error: Error): error is Error & { code: string } {
    return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string";
}
