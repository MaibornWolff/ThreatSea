/**
 * Module that defines the functionality that is used to write logs to stdout.
 */
import { Logger } from "#logging/index.js";
import { NextFunction, Request, Response } from "express";

/**
 * Middleware function that acts as a global middleware to implement request logging.
 * The requests store their log in the request object and print it as soon as the request
 * has been finished.
 *
 * Error handling come after the logging, because it will additionally log the error.
 *
 * @param {Request} request - The http request.
 * @param {Response} _response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export function LogHandler(request: Request, _response: Response, next: NextFunction): void {
    Logger.debug(`Request: ${request.method} ${request.url}`);

    next();
}
