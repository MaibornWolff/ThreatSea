/**
 * Module that defines routing for the threats of each
 * catalogue.
 */

import express from "express";
import {
    createCatalogThreat,
    deleteCatalogThreat,
    getCatalogThreats,
    importCatalogThreats,
    updateCatalogThreat,
} from "#controllers/catalog-threats.controller.js";
import { CheckCatalogRoleHandler } from "#guards/authorisation.guard.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import {
    CatalogThreatIdParam,
    CatalogThreatResponse,
    CreateCatalogThreatRequest,
    UpdateCatalogThreatRequest,
} from "#types/catalog-threat.types.js";
import { CheckCatalogExistenceHandler } from "#middlewares/check-existence.middleware.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const catalogThreatsRouter = express.Router({ mergeParams: true });
const idParam = "catalogThreatId";

catalogThreatsRouter.use<CatalogIdParam>(ValidateParamHandler(CatalogIdParam), CheckCatalogExistenceHandler);

catalogThreatsRouter.get<CatalogIdParam, CatalogThreatResponse[], void>(
    "/",
    ValidateParamHandler(CatalogIdParam),
    CheckCatalogRoleHandler(USER_ROLES.VIEWER),
    getCatalogThreats
);

catalogThreatsRouter.post<CatalogIdParam, CatalogThreatResponse, CreateCatalogThreatRequest>(
    "/",
    ValidateParamHandler(CatalogIdParam),
    ValidateBodyHandler(CreateCatalogThreatRequest),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    createCatalogThreat
);

catalogThreatsRouter.put<CatalogThreatIdParam, CatalogThreatResponse, UpdateCatalogThreatRequest>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogThreatIdParam),
    ValidateBodyHandler(UpdateCatalogThreatRequest),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    updateCatalogThreat
);

catalogThreatsRouter.delete<CatalogThreatIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogThreatIdParam),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    deleteCatalogThreat
);

catalogThreatsRouter.post<CatalogIdParam, CatalogThreatResponse[], CreateCatalogThreatRequest[]>(
    "/import",
    ValidateParamHandler(CatalogIdParam),
    CheckCatalogRoleHandler(USER_ROLES.EDITOR),
    importCatalogThreats
);
