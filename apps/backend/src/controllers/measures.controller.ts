/**
 * Module that defines the controllers of the measures
 * routes.
 */
import { NextFunction, Request, Response } from "express";
import * as MeasuresService from "#services/measures.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { ProjectIdParam } from "#types/project.types.js";
import { CreateMeasureRequest, MeasureIdParam, MeasureResponse, UpdateMeasureRequest } from "#types/measure.types.js";

/**
 * Gets all the measures of a project.
 *
 * @param {request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getMeasures(
    request: Request<ProjectIdParam, MeasureResponse[], void>,
    response: Response<MeasureResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const measures: MeasureResponse[] = await MeasuresService.getMeasures(projectId);

    response.json(measures);
}

/**
 * Creates a measure.
 *
 * @param {request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function createMeasure(
    request: Request<ProjectIdParam, MeasureResponse, CreateMeasureRequest>,
    response: Response<MeasureResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;

    const data = request.body;
    try {
        const measure = await MeasuresService.createMeasure({
            ...data,
            projectId,
        });

        response.json(measure);
    } catch (error) {
        next(error);
    }
}

/**
 * Updates a measure.
 *
 * @param {request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateMeasure(
    request: Request<MeasureIdParam, MeasureResponse, UpdateMeasureRequest>,
    response: Response<MeasureResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const measureId = request.params.measureId;

    const measure: MeasureResponse | null = await MeasuresService.getMeasure(measureId);

    if (measure === null) {
        next(new NotFoundError("Measure not found"));
        return;
    }
    if (measure.projectId !== projectId) {
        next(new BadRequestError("Measure does not belong to this project"));
        return;
    }

    const data = request.body;
    try {
        const updatedMeasure: MeasureResponse = await MeasuresService.updateMeasure(projectId, measureId, data);

        response.json(updatedMeasure);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes a measure.
 *
 * @param {request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteMeasure(
    request: Request<MeasureIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const measureId = request.params.measureId;

    const measure = await MeasuresService.getMeasure(measureId);

    if (measure === null) {
        next(new NotFoundError("Measure not found"));
        return;
    }
    if (measure.projectId !== projectId) {
        next(new BadRequestError("Measure does not belong to this project"));
        return;
    }

    await MeasuresService.deleteMeasure(measureId);

    response.sendStatus(204);
}
