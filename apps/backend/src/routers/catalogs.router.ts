/**
 * Module that defines the routes for the catalogues.
 */
import express from "express";
import {
    createCatalog,
    deleteCatalog,
    getCatalog,
    getCatalogs,
    updateCatalog,
} from "#controllers/catalogs.controller.js";
import { catalogThreatsRouter } from "#routers/catalog-threats.router.js";
import { catalogMeasuresRouter } from "#routers/catalog-measures.router.js";
import { catalogMembersRouter } from "#routers/catalog-members.router.js";
import { CheckCatalogExistenceHandler } from "#middlewares/check-existence.middleware.js";
import { CheckCatalogRoleHandler } from "#guards/authorisation.guard.js";
import { CatalogIdParam, CatalogResponse, CreateCatalogRequest, UpdateCatalogRequest } from "#types/catalog.types.js";
import { USER_ROLES } from "#types/user-roles.types.js";
import {
    ValidateBodyHandler,
    ValidateParamHandler,
} from "#middlewares/input-validations/input-validation.middleware.js";

export const catalogsRouter = express.Router();
const idParam = "catalogId";

/** Catalogue routing. */
catalogsRouter.get<void, CatalogResponse[], void>("/", getCatalogs);

catalogsRouter.get<CatalogIdParam, CatalogResponse, void>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogIdParam),
    CheckCatalogExistenceHandler,
    CheckCatalogRoleHandler(USER_ROLES.VIEWER),
    getCatalog
);

catalogsRouter.post<void, CatalogResponse, CreateCatalogRequest>(
    "/",
    ValidateBodyHandler(CreateCatalogRequest),
    createCatalog
);

catalogsRouter.put<CatalogIdParam, CatalogResponse, UpdateCatalogRequest>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogIdParam),
    ValidateBodyHandler(UpdateCatalogRequest),
    CheckCatalogExistenceHandler,
    CheckCatalogRoleHandler(USER_ROLES.OWNER),
    updateCatalog
);

catalogsRouter.delete<CatalogIdParam, void, void>(
    `/:${idParam}`,
    ValidateParamHandler(CatalogIdParam),
    CheckCatalogExistenceHandler,
    CheckCatalogRoleHandler(USER_ROLES.OWNER),
    deleteCatalog
);

/** Using routes for the threats and measures of each catalog */
catalogsRouter.use(`/:${idParam}/threats`, ValidateParamHandler(CatalogIdParam), CheckCatalogExistenceHandler);
catalogsRouter.use(`/:${idParam}/threats`, catalogThreatsRouter);

catalogsRouter.use(`/:${idParam}/measures`, ValidateParamHandler(CatalogIdParam), CheckCatalogExistenceHandler);
catalogsRouter.use(`/:${idParam}/measures`, catalogMeasuresRouter);

catalogsRouter.use(`/:${idParam}/members`, ValidateParamHandler(CatalogIdParam), CheckCatalogExistenceHandler);
catalogsRouter.use(`/:${idParam}/members`, catalogMembersRouter);
