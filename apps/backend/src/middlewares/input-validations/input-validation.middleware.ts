import { NextFunction, Request, Response } from "express";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { InputValidationError } from "#errors/bad-request.error.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import { ProjectIdParam } from "#types/project.types.js";

export function ValidateBodyHandler<T extends object, P extends CatalogIdParam | ProjectIdParam | void>(
    type: new () => T
) {
    return async (request: Request<P>, _response: Response, next: NextFunction) => {
        const transformedBody = plainToInstance(type, request.body, { enableImplicitConversion: true });

        const errors = await validate(transformedBody, { whitelist: false });

        if (errors.length > 0) {
            next(new InputValidationError(errors));
            return;
        }

        request.body = transformedBody;
        next();
    };
}

export function ValidateParamHandler<P extends CatalogIdParam | ProjectIdParam>(type: new () => P) {
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
