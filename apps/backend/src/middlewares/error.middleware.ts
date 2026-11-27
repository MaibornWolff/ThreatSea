import type { NextFunction, Request, Response } from "express";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { DatabaseError } from "pg";
import { ServerError } from "#errors/server.error.js";
import { Logger } from "#logging/index.js";
import { UnexpectedError } from "#errors/unexpected.error.js";
import { CSRFTokenError } from "#errors/forbidden.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { ConflictError } from "#errors/conflict.error.js";
import { PayloadTooLargeError } from "#errors/payload-too-large.error.js";

// https://www.postgresql.org/docs/current/errcodes-appendix.html
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const RESTRICT_VIOLATION = "23001";
const INVALID_VALUE_CODES = new Set([
    "23502", // not_null_violation
    "23514", // check_violation
    "22001", // string_data_right_truncation
    "22003", // numeric_value_out_of_range
    "22007", // invalid_datetime_format
    "22008", // datetime_field_overflow
    "22P02", // invalid_text_representation, e.g. an unknown enum value
]);

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

    if (error instanceof ServerError) {
        return error;
    }

    const clientError = mapRequestError(error) ?? mapDatabaseError(error);
    if (clientError) {
        Logger.debug(`Mapped error to ${clientError.statusCode}:\n${describe(error)}`);
        return clientError;
    }

    const logId = Logger.error(`Unexpected Error:\n${describe(error)}\n${error.stack}`)!;
    return new UnexpectedError(logId);
}

// Errors of express and body-parser (http-errors) carry their own client status, e.g. malformed or
// oversized JSON bodies. Their messages are internal, so only the status is passed on.
function mapRequestError(error: Error): ServerError | null {
    const status = (error as { status?: unknown }).status;
    if (typeof status !== "number" || status < 400 || status > 499) {
        return null;
    }
    if (status === 413) {
        return new PayloadTooLargeError("Request body is too large");
    }
    return new BadRequestError("Invalid request");
}

// Constraint violations are caused by the request data; translate them instead of exposing SQL.
function mapDatabaseError(error: Error): ServerError | null {
    const databaseError = error instanceof DatabaseError ? error : error.cause;
    if (!(databaseError instanceof DatabaseError) || databaseError.code === undefined) {
        return null;
    }

    if (databaseError.code === UNIQUE_VIOLATION) {
        return new ConflictError("A resource with these values already exists");
    }
    if (databaseError.code === RESTRICT_VIOLATION || isDeleteOfReferencedRow(error, databaseError)) {
        return new ConflictError("The resource is still referenced by other data");
    }
    if (databaseError.code === FOREIGN_KEY_VIOLATION) {
        return new BadRequestError("A referenced resource does not exist");
    }
    if (INVALID_VALUE_CODES.has(databaseError.code)) {
        return new BadRequestError("Invalid value");
    }
    return null;
}

function isDeleteOfReferencedRow(error: Error, databaseError: DatabaseError): boolean {
    return (
        databaseError.code === FOREIGN_KEY_VIOLATION &&
        error instanceof DrizzleQueryError &&
        /^\s*delete\b/i.test(error.query)
    );
}

function describe(error: Error): string {
    const cause = error.cause instanceof Error ? `\ncause: ${error.cause.message}` : "";
    return `${error.message}${cause}`;
}

function isErrorWithCode(error: Error): error is Error & { code: string } {
    return typeof error === "object" && error != null && "code" in error && typeof error.code === "string";
}
