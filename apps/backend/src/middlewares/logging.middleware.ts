/**
 * Module that defines the functionality that is used to write logs to stdout.
 */
import { Logger } from "#logging/index.js";
import { NextFunction, Request, Response } from "express";

/**
 * Middleware function that acts as a global middleware to implement request logging.
 * Each request is logged once it has ended, with its response status, or as aborted when the
 * connection closed before the response was sent (e.g. the client cancelled the request).
 *
 * Error handling come after the logging, because it will additionally log the error.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export function LogHandler(request: Request, response: Response, next: NextFunction): void {
    // "close" is emitted for every response, after "finish" when one was sent; the original URL is
    // used because routers rewrite request.url to their own mount path while handling it.
    response.on("close", () => {
        const outcome = response.writableFinished ? response.statusCode : "aborted";
        Logger.debug(`Request: ${request.method} ${request.originalUrl} ${outcome}`);
    });

    next();
}
