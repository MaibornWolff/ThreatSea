/**
 * Module that defines the controller functions for
 * the threat routing.
 */
import { NextFunction, Request, Response } from "express";
import * as ThreatsService from "#services/threats.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { ProjectIdParam } from "#types/project.types.js";
import {
    CreateThreatRequest,
    ExtendedThreatResponse,
    ThreatIdParam,
    ThreatResponse,
    UpdateThreatRequest,
} from "#types/threat.types.js";

/**
 * Gets all threats of the current project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getThreats(
    request: Request<ProjectIdParam, ExtendedThreatResponse[], void>,
    response: Response<ExtendedThreatResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const threats: ExtendedThreatResponse[] = await ThreatsService.getThreats(projectId);

    response.json(threats);
}

/**
 * Gets the threat by the specified id.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getThreat(
    request: Request<ThreatIdParam, ThreatResponse, void>,
    response: Response<ThreatResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const threatId = request.params.threatId;

    const threat: ThreatResponse | null = await ThreatsService.getThreat(threatId);
    if (threat === null) {
        next(new NotFoundError("Threat not found"));
        return;
    }
    if (threat.projectId !== projectId) {
        next(new BadRequestError("Threat does not belong to this project"));
        return;
    }

    response.json(threat);
}

/**
 * Creates a new threat for the specified project.
 */
export async function createThreat(
    request: Request<ProjectIdParam, ThreatResponse, CreateThreatRequest>,
    response: Response<ThreatResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;

    const data = request.body;
    try {
        const threat: ThreatResponse = await ThreatsService.createThreat({
            ...data,
            projectId,
        });

        response.json(threat);
    } catch (error) {
        next(error);
    }
}

/**
 * Updates the threat with the specified id.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateThreats(
    request: Request<ThreatIdParam, ThreatResponse, UpdateThreatRequest>,
    response: Response<ThreatResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const threatId = request.params.threatId;

    const threat: ThreatResponse | null = await ThreatsService.getThreat(threatId);
    if (threat === null) {
        next(new NotFoundError("Threat not found"));
        return;
    }
    if (threat.projectId !== projectId) {
        next(new BadRequestError("Threat does not belong to this project"));
        return;
    }

    const data = request.body;
    try {
        const updatedThreat = await ThreatsService.updateThreat(threatId, {
            ...data,
            projectId,
        });

        response.json(updatedThreat);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes the threat with the specified id.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteThreats(
    request: Request<ThreatIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const threatId = request.params.threatId;

    const threat: ThreatResponse | null = await ThreatsService.getThreat(threatId);
    if (threat === null) {
        next(new NotFoundError("Threat not found"));
        return;
    }
    if (threat.projectId !== projectId) {
        next(new BadRequestError("Threat does not belong to this project"));
        return;
    }

    await ThreatsService.deleteThreat(threatId);

    response.sendStatus(204);
}
