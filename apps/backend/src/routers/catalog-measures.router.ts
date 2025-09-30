/**
 * Module that defines the routes for each
 * measure of a catalogue.
 */

import express from "express";
import {
    createCatalogMeasure,
    deleteCatalogMeasure,
    getCatalogMeasures,
    importCatalogMeasures,
    updateCatalogMeasure,
} from "#controllers/catalog-measures.controller.js";
import { CheckCatalogRoleHandler } from "#guards/authorisation.guard.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import {
    CatalogMeasureIdParam,
    CatalogMeasureResponse,
    CreateCatalogMeasureRequest,
    UpdateCatalogMeasureRequest,
} from "#types/catalog-measure.types.js";
import { CheckCatalogExistenceHandler } from "#middlewares/check-existence.middleware.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const catalogMeasuresRouter = express.Router({ mergeParams: true });
const idParam = "catalogMeasureId";

catalogMeasuresRouter.use<CatalogIdParam>(ValidateParamHandler(CatalogIdParam), CheckCatalogExistenceHandler);

catalogMeasuresRouter.get<CatalogIdParam, CatalogMeasureResponse[], void>(
    "/",
    ValidateParamHandler(CatalogIdParam),
    CheckCatalogRoleHandler(USER_ROLES.VIEWER),
    getCatalogMeasures
);

catalogMeasuresRouter.post<CatalogIdParam, CatalogMeasureResponse, CreateCatalogMeasureRequest>(
    "/",
    ValidateParamHandler(CatalogIdParam),
    ValidateBodyHandler(CreateCatalogMeasureRequest),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    createCatalogMeasure
);

catalogMeasuresRouter.put<CatalogMeasureIdParam, CatalogMeasureResponse, UpdateCatalogMeasureRequest>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogMeasureIdParam),
    ValidateBodyHandler(UpdateCatalogMeasureRequest),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    updateCatalogMeasure
);

catalogMeasuresRouter.delete<CatalogMeasureIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogMeasureIdParam),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    deleteCatalogMeasure
);

catalogMeasuresRouter.post<CatalogIdParam, CatalogMeasureResponse[], CreateCatalogMeasureRequest[]>(
    "/import",
    ValidateParamHandler(CatalogIdParam),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    importCatalogMeasures
);
