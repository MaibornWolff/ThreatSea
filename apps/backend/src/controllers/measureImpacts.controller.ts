/**
 * @module members.controller - Defines the controlling function
 *     for the routing of the members.
 */
import { NextFunction, Request, Response } from "express";
import * as MeasureImpactsService from "#services/measureImpacts.service.js";
import { getMeasure } from "#services/measures.service.js";
import { cleanUpUnusedImpacts, getThreat } from "#services/threats.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { ProjectIdParam } from "#types/project.types.js";
import {
    CreateMeasureImpactRequest,
    MeasureImpactIdParam,
    MeasureImpactResponse,
    UpdateMeasureImpactRequest,
} from "#types/measure-impact.types.js";
import { MeasureResponse } from "#types/measure.types.js";
import { ThreatResponse } from "#types/threat.types.js";

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

    await cleanUpUnusedImpacts(projectId);

    const measureImpacts: MeasureImpactResponse[] = await MeasureImpactsService.getMeasureImpactsByProject(projectId);

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

    const measureImpact: MeasureImpactResponse | null = await MeasureImpactsService.getMeasureImpact(measureImpactId);
    if (measureImpact === null) {
        next(new NotFoundError("Measure Impact not found"));
        return;
    }

    const measure: MeasureResponse | null = await getMeasure(measureImpact.measureId);
    const threat: ThreatResponse | null = await getThreat(measureImpact.threatId);
    if (measure?.projectId !== projectId || threat?.projectId !== projectId) {
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
    const threatId = request.body.threatId;

    const measure: MeasureResponse | null = await getMeasure(measureId);
    const threat: ThreatResponse | null = await getThreat(threatId);

    if (measure === null) {
        next(new NotFoundError("Measure not found"));
        return;
    }
    if (threat === null) {
        next(new NotFoundError("Threat not found"));
        return;
    }
    if (measure.projectId !== projectId) {
        next(new BadRequestError("Measure is not part of this project"));
        return;
    }
    if (threat.projectId !== projectId) {
        next(new BadRequestError("Threat is not part of this project"));
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

    const measureImpact: MeasureImpactResponse | null = await MeasureImpactsService.getMeasureImpact(measureImpactId);
    if (measureImpact === null) {
        next(new NotFoundError("Measure Impact not found"));
        return;
    }

    const measure: MeasureResponse | null = await getMeasure(measureImpact.measureId);
    const threat: ThreatResponse | null = await getThreat(measureImpact.threatId);
    if (measure?.projectId !== projectId || threat?.projectId !== projectId) {
        next(new BadRequestError("Measure Impact is not part of this project"));
        return;
    }

    const data = request.body;
    try {
        const updatedMeasureImpact: MeasureImpactResponse = await MeasureImpactsService.updateMeasureImpact(
            measureImpactId,
            data
        );

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

    const measureImpact: MeasureImpactResponse | null = await MeasureImpactsService.getMeasureImpact(measureImpactId);
    if (measureImpact === null) {
        next(new NotFoundError("Measure Impact not found"));
        return;
    }

    const measure = await getMeasure(measureImpact.measureId);
    const threat = await getThreat(measureImpact.threatId);
    if (measure?.projectId !== projectId || threat?.projectId !== projectId) {
        next(new BadRequestError("Measure Impact is not part of this project"));
        return;
    }

    await MeasureImpactsService.deleteMeasureImpact(measureImpactId);

    response.sendStatus(204);
}
