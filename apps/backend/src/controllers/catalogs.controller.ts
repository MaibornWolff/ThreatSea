/**
 * Module that defines the controller function for
 * the catalogue routing.
 */
import { NextFunction, Request, Response } from "express";
import * as CatalogsService from "#services/catalogs.service.js";
import {
    CatalogIdParam,
    CatalogResponse,
    CatalogWithRoleResponse,
    CreateCatalogRequest,
    UpdateCatalogRequest,
} from "#types/catalog.types.js";
import { NotFoundError } from "#errors/not-found.error.js";

/**
 * Fetches the catalogues from the database.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getCatalogs(
    request: Request<void, CatalogWithRoleResponse[], void>,
    response: Response<CatalogWithRoleResponse[]>
): Promise<void> {
    const catalogs: CatalogWithRoleResponse[] = await CatalogsService.getCatalogsByUserId(request.user!.id!);

    response.json(catalogs);
}

/**
 * Gets a catalog by its id and the user id.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getCatalog(
    request: Request<CatalogIdParam, CatalogWithRoleResponse, void>,
    response: Response<CatalogWithRoleResponse>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;

    const catalog: CatalogWithRoleResponse | null = await CatalogsService.getCatalog(catalogId, request.user!.id!);
    if (!catalog) {
        next(new NotFoundError("Catalog not found"));
        return;
    }

    response.json(catalog);
}

/**
 * Creates a new catalogue.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function createCatalog(
    request: Request<void, CatalogResponse, CreateCatalogRequest>,
    response: Response<CatalogResponse>,
    next: NextFunction
): Promise<void> {
    const data = request.body;
    try {
        let catalog: CatalogResponse;
        if (data.defaultContent) {
            catalog = await CatalogsService.createDefaultCatalog(data, request.user!.id!);
        } else {
            catalog = await CatalogsService.createEmptyCatalog(data, request.user!.id!);
        }

        response.json(catalog);
    } catch (error) {
        next(error);
    }
}

/**
 * Updates a catalog.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateCatalog(
    request: Request<CatalogIdParam, CatalogResponse, UpdateCatalogRequest>,
    response: Response<CatalogResponse>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;

    const data = request.body;
    try {
        const catalog: CatalogResponse = await CatalogsService.updateCatalog(catalogId, data);

        response.json(catalog);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes a catalogue.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function deleteCatalog(
    request: Request<CatalogIdParam, void, void>,
    response: Response<void>
): Promise<void> {
    const catalogId = request.params.catalogId;

    await CatalogsService.deleteCatalog(catalogId);

    response.sendStatus(204);
}
