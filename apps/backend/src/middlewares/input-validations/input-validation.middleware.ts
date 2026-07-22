import { NextFunction, Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BadRequestError, InputValidationError } from "#errors/bad-request.error.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import { FolderIdParam } from "#types/folder.types.js";
import { ProjectIdParam } from "#types/project.types.js";

export type CrossFieldCheck<T> = (instance: T) => string | null;

export function ValidateBodyHandler<T extends object, P extends CatalogIdParam | ProjectIdParam | FolderIdParam | void>(
    type: new () => T,
    crossFieldChecks: readonly CrossFieldCheck<T>[] = []
) {
    return async (request: Request<P>, _response: Response, next: NextFunction) => {
        const transformedBody = plainToInstance(type, request.body, { enableImplicitConversion: true });

        const errors = await validate(transformedBody, { whitelist: false });

        if (errors.length > 0) {
            next(new InputValidationError(errors));
            return;
        }

        for (const check of crossFieldChecks) {
            const message = check(transformedBody);
            if (message != null) {
                next(new BadRequestError(message));
                return;
            }
        }

        request.body = transformedBody;
        next();
    };
}

export function ValidateParamHandler<P extends CatalogIdParam | ProjectIdParam | FolderIdParam>(type: new () => P) {
    return async (request: Request<P>, _response: Response, next: NextFunction) => {
        const transformedParams = plainToInstance(type, request.params, { enableImplicitConversion: true });

        const errors = await validate(transformedParams, { whitelist: true });

        if (errors.length > 0) {
            next(new InputValidationError(errors));
            return;
        }

        request.params = transformedParams;
        next();
    };
}
