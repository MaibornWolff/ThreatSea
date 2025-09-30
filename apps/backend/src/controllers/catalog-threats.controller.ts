/**
 * Module that defines controlling functions
 * for the catalogue threat routing.
 */
import { NextFunction, Request, Response } from "express";
import * as CatalogThreatsService from "#services/catalog-threats.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import {
    CatalogThreatIdParam,
    CatalogThreatResponse,
    CreateCatalogThreatRequest,
    UpdateCatalogThreatRequest,
} from "#types/catalog-threat.types.js";

/**
 * Gets all catalog threats of the specified catalog.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getCatalogThreats(
    request: Request<CatalogIdParam, CatalogThreatResponse[], void>,
    response: Response<CatalogThreatResponse[]>
): Promise<void> {
    const catalogId = request.params.catalogId!;

    const catalogThreats: CatalogThreatResponse[] = await CatalogThreatsService.getCatalogThreatsByCatalogId(catalogId);

    response.json(catalogThreats);
}

/**
 * Creates a new catalog threat.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function createCatalogThreat(
    request: Request<CatalogIdParam, CatalogThreatResponse, CreateCatalogThreatRequest>,
    response: Response<CatalogThreatResponse>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const data = request.body;

    try {
        const catalogThreat = await CatalogThreatsService.createCatalogThreat({ ...data, catalogId });

        response.json(catalogThreat);
    } catch (error) {
        next(error);
    }
}

/**
 * Imports catalog threats.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function importCatalogThreats(
    request: Request<CatalogIdParam, CatalogThreatResponse[], CreateCatalogThreatRequest[]>,
    response: Response<CatalogThreatResponse[]>
): Promise<void> {
    const catalogId = request.params.catalogId;
    const data = request.body;

    const catalogThreats = await CatalogThreatsService.importCatalogThreats(
        data.map((catalogThreat) => ({ ...catalogThreat, catalogId }))
    );

    response.json(catalogThreats);
}

/**
 * Updates a catalog threat.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateCatalogThreat(
    request: Request<CatalogThreatIdParam, CatalogThreatResponse, UpdateCatalogThreatRequest>,
    response: Response<CatalogThreatResponse>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const catalogThreatId = request.params.catalogThreatId;

    const catalogThreat: CatalogThreatResponse | null =
        await CatalogThreatsService.getCatalogThreatById(catalogThreatId);

    if (catalogThreat === null) {
        next(new NotFoundError("Catalog Threat not found"));
        return;
    }
    if (catalogThreat.catalogId !== catalogId) {
        next(new BadRequestError("Catalog Threat is not part of this catalog"));
        return;
    }

    const data = request.body;
    try {
        const updatedCatalogThreat = await CatalogThreatsService.updateCatalogThreat(catalogThreatId, data);

        response.json(updatedCatalogThreat);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes a catalog threat.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteCatalogThreat(
    request: Request<CatalogThreatIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const catalogThreatId = request.params.catalogThreatId;

    const catalogThreat: CatalogThreatResponse | null =
        await CatalogThreatsService.getCatalogThreatById(catalogThreatId);

    if (catalogThreat === null) {
        next(new NotFoundError("Catalog Threat not found"));
        return;
    }
    if (catalogThreat.catalogId !== catalogId) {
        next(new BadRequestError("Catalog Threat is not part of this catalog"));
        return;
    }

    await CatalogThreatsService.deleteCatalogThreat(catalogThreatId);

    response.sendStatus(204);
}
