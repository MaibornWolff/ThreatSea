/**
 * @module server.error - Base definitions for server errors and error responses
 */
export abstract class ServerError extends Error {
    public readonly statusCode: number;
    public readonly type: string;
    public readonly code: string | null;

    protected constructor(statusCode: number, type: string, message: string, code: string | null) {
        super(message);
        this.statusCode = statusCode;
        this.type = type;
        this.code = code;
    }

    public getErrorResponse(): ErrorResponse {
        return this.buildErrorResponse();
    }

    protected buildErrorResponse<T extends ErrorResponseBody>(body?: T): ErrorResponse {
        return {
            status: this.statusCode,
            body: body
                ? {
                      ...body,
                      type: this.type,
                      code: this.code,
                  }
                : {
                      type: this.type,
                      message: this.message,
                      code: this.code,
                  },
        };
    }
}

export interface ErrorResponse {
    status: number;
    body: ErrorResponseBody & {
        type: string;
        code: string | null;
    };
}

export interface ErrorResponseBody {
    message: string;
}
