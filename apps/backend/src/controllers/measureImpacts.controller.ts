/**
 * @module members.controller - Defines the controlling function
 *     for the routing of the members.
 */
import { NextFunction, Request, Response } from "express";
import * as MeasureImpactsService from "#services/measureImpacts.service.js";
import { getMeasure } from "#services/measures.service.js";
import { getChildThreat } from "#services/childThreats.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { ProjectIdParam } from "#types/project.types.js";
import {
    ChildThreatMeasureImpactResponse,
    CreateMeasureImpactRequest,
    MeasureImpactIdParam,
    MeasureImpactResponse,
    UpdateMeasureImpactRequest,
} from "#types/measure-impact.types.js";
import { MeasureResponse } from "#types/measure.types.js";
import { ChildThreatIdParam, ChildThreatResponse } from "#types/childThreat.types.js";

/**
 * Gets all measure impacts of a project.
 *
 * @param {object} request - The http request.
 * @param {object} response - The http response.
 */
export async function getMeasureImpacts(
    request: Request<ProjectIdParam, MeasureImpactResponse[], void>,
    response: Response<MeasureImpactResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const measureImpacts: MeasureImpactResponse[] =
        await MeasureImpactsService.getMeasureImpactsByProject(projectId);

    response.json(measureImpacts);
}

/**
 * Gets all child-threat-linked measure impacts of a specific child threat.
 *
 * @param {object} request - The http request.
 * @param {object} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getMeasureImpactsByChildThreat(
    request: Request<ChildThreatIdParam, ChildThreatMeasureImpactResponse[], void>,
    response: Response<ChildThreatMeasureImpactResponse[]>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const childThreatId = request.params.childThreatId;

    const childThreat: ChildThreatResponse | null = await getChildThreat(childThreatId);
    if (childThreat === null) {
        next(new NotFoundError("Child Threat not found"));
        return;
    }

    if (childThreat.projectId !== projectId) {
        next(new BadRequestError("Child Threat is not part of this project"));
        return;
    }

    const measureImpacts: ChildThreatMeasureImpactResponse[] =
        await MeasureImpactsService.getMeasureImpactsByThreat(childThreatId);

    response.json(measureImpacts);
}

/**
 * Gets a specific measure impact by its id.
 *
 * @param {object} request - The http request.
 * @param {object} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getMeasureImpact(
    request: Request<MeasureImpactIdParam, MeasureImpactResponse, void>,
    response: Response<MeasureImpactResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const measureImpactId = request.params.measureImpactId;

    const measureImpact: MeasureImpactResponse | null =
        await MeasureImpactsService.getMeasureImpact(measureImpactId);
    if (measureImpact === null) {
        next(new NotFoundError("Measure Impact not found"));
        return;
    }

    const measure: MeasureResponse | null = await getMeasure(measureImpact.measureId);
    const childThreat: ChildThreatResponse | null = await getChildThreat(measureImpact.childThreatId!);
    if (measure?.projectId !== projectId || childThreat?.projectId !== projectId) {
        next(new BadRequestError("Measure Impact is not part of this project"));
        return;
    }

    response.json(measureImpact);
}

/**
 * Creates a measure impact.
 *
 * @param {object} request - The http request.
 * @param {object} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function createMeasureImpact(
    request: Request<ProjectIdParam, MeasureImpactResponse, CreateMeasureImpactRequest>,
    response: Response<MeasureImpactResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const measureId = request.body.measureId;
    const childThreatId = request.body.childThreatId;

    const measure: MeasureResponse | null = await getMeasure(measureId);
    const childThreat: ChildThreatResponse | null = await getChildThreat(childThreatId);

    if (measure === null) {
        next(new NotFoundError("Measure not found"));
        return;
    }
    if (childThreat === null) {
        next(new NotFoundError("Child Threat not found"));
        return;
    }
    if (measure.projectId !== projectId) {
        next(new BadRequestError("Measure is not part of this project"));
        return;
    }
    if (childThreat.projectId !== projectId) {
        next(new BadRequestError("Child Threat is not part of this project"));
        return;
    }

    try {
        const measureImpact = await MeasureImpactsService.createMeasureImpact(request.body);

        response.json(measureImpact);
    } catch (error) {
        next(error);
    }
}

/**
 * Updates a specific measureImpact of a project.
 *
 * @param {object} request - The http request.
 * @param {object} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateMeasureImpact(
    request: Request<MeasureImpactIdParam, MeasureImpactResponse, UpdateMeasureImpactRequest>,
    response: Response<MeasureImpactResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId!;
    const measureImpactId = request.params.measureImpactId!;

    const measureImpact: MeasureImpactResponse | null =
        await MeasureImpactsService.getMeasureImpact(measureImpactId);
    if (measureImpact === null) {
        next(new NotFoundError("Measure Impact not found"));
        return;
    }

    const measure: MeasureResponse | null = await getMeasure(measureImpact.measureId);
    const childThreat: ChildThreatResponse | null = await getChildThreat(measureImpact.childThreatId!);
    if (measure?.projectId !== projectId || childThreat?.projectId !== projectId) {
        next(new BadRequestError("Measure Impact is not part of this project"));
        return;
    }

    const data = request.body;
    try {
        const updatedMeasureImpact: MeasureImpactResponse =
            await MeasureImpactsService.updateMeasureImpact(measureImpactId, data);

        response.json(updatedMeasureImpact);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes a specific measureImpact.
 *
 * @param {object} request - The http request.
 * @param {object} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteMeasureImpact(
    request: Request<MeasureImpactIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId!;
    const measureImpactId = request.params.measureImpactId!;

    const measureImpact: MeasureImpactResponse | null =
        await MeasureImpactsService.getMeasureImpact(measureImpactId);
    if (measureImpact === null) {
        next(new NotFoundError("Measure Impact not found"));
        return;
    }

    const measure = await getMeasure(measureImpact.measureId);
    const childThreat = await getChildThreat(measureImpact.childThreatId!);
    if (measure?.projectId !== projectId || childThreat?.projectId !== projectId) {
        next(new BadRequestError("Measure Impact is not part of this project"));
        return;
    }

    await MeasureImpactsService.deleteMeasureImpact(measureImpactId);

    response.sendStatus(204);
}
