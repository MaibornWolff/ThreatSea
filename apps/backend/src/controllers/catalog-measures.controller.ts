/**
 * Module that defines the controlling function
 * for the catalogue measure routing.
 */
import { NextFunction, Request, Response } from "express";
import * as CatalogMeasuresService from "#services/catalog-measures.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import {
    CatalogMeasureIdParam,
    CatalogMeasureResponse,
    CreateCatalogMeasureRequest,
    UpdateCatalogMeasureRequest,
} from "#types/catalog-measure.types.js";

/**
 * Gets all catalog measures of the specified catalog.
 *
 * @param {request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getCatalogMeasures(
    request: Request<CatalogIdParam, CatalogMeasureResponse[], void>,
    response: Response<CatalogMeasureResponse[]>
): Promise<void> {
    const catalogId = request.params.catalogId!;

    const catalogMeasures: CatalogMeasureResponse[] =
        await CatalogMeasuresService.getCatalogMeasuresByCatalogId(catalogId);

    response.json(catalogMeasures);
}

/**
 * Creates a catalogue measure.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function createCatalogMeasure(
    request: Request<CatalogIdParam, CatalogMeasureResponse, CreateCatalogMeasureRequest>,
    response: Response<CatalogMeasureResponse>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const data = request.body;

    try {
        const catalogMeasure: CatalogMeasureResponse = await CatalogMeasuresService.createCatalogMeasure({
            ...data,
            catalogId,
        });

        response.json(catalogMeasure);
    } catch (error) {
        next(error);
    }
}

/**
 * Imports catalog measures.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function importCatalogMeasures(
    request: Request<CatalogIdParam, CatalogMeasureResponse[], CreateCatalogMeasureRequest[]>,
    response: Response<CatalogMeasureResponse[]>
): Promise<void> {
    const catalogId = request.params.catalogId;
    const data = request.body;

    const catalogMeasures: CatalogMeasureResponse[] = await CatalogMeasuresService.importCatalogMeasures(
        data.map((catalogMeasure) => ({ ...catalogMeasure, catalogId }))
    );

    response.json(catalogMeasures);
}

/**
 * Updates a catalog measure.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateCatalogMeasure(
    request: Request<CatalogMeasureIdParam, CatalogMeasureResponse, UpdateCatalogMeasureRequest>,
    response: Response<CatalogMeasureResponse>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const catalogMeasureId = request.params.catalogMeasureId;

    const catalogMeasure: CatalogMeasureResponse | null =
        await CatalogMeasuresService.getCatalogMeasureById(catalogMeasureId);

    if (catalogMeasure === null) {
        next(new NotFoundError("Catalog Measure not found"));
        return;
    }
    if (catalogMeasure.catalogId !== catalogId) {
        next(new BadRequestError("Catalog Measure is not part of this catalog"));
        return;
    }

    const data = request.body;
    try {
        const updatedCatalogMeasure: CatalogMeasureResponse = await CatalogMeasuresService.updateCatalogMeasure(
            catalogMeasureId,
            data
        );

        response.json(updatedCatalogMeasure);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes a catalog measure.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteCatalogMeasure(
    request: Request<CatalogMeasureIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;
    const catalogMeasureId = request.params.catalogMeasureId;

    const catalogMeasure: CatalogMeasureResponse | null =
        await CatalogMeasuresService.getCatalogMeasureById(catalogMeasureId);

    if (catalogMeasure === null) {
        next(new NotFoundError("Catalog Measure not found"));
        return;
    }
    if (catalogMeasure.catalogId !== catalogId) {
        next(new BadRequestError("Catalog Measure is not part of this catalog"));
        return;
    }

    await CatalogMeasuresService.deleteCatalogMeasure(catalogMeasureId);

    response.sendStatus(204);
}
