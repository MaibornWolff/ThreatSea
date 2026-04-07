/**
 * Module that defines the controller functions for
 * the generic threat routing.
 */
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "#errors/bad-request.error.js";
import { NotFoundError } from "#errors/not-found.error.js";
import {
    GenericThreatWithChExtendedChildrenResponse,
    GenericThreatIdParam,
    GenericThreatResponse,
} from "#types/genericThreat.types.js";
import { ProjectIdParam } from "#types/project.types.js";
import * as genericThreatsService from "#services/genericThreats.service.js";

/**
 * Gets all generic threats of the current project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getGenericThreatsByProjectId(
    request: Request<ProjectIdParam, GenericThreatResponse[], void>,
    response: Response<GenericThreatResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const genericThreats = await genericThreatsService.getGenericThreatsByProjectId(projectId);

    response.json(genericThreats);
}

/**
 * Gets the threat by the specified id.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getGenericThreat(
    request: Request<GenericThreatIdParam, GenericThreatResponse, void>,
    response: Response<GenericThreatResponse>,
    next: NextFunction
): Promise<void> {
    const genericThreatId = request.params.genericThreatId;
    const genericThreatProjectId = request.params.projectId;

    const genericThreat = await genericThreatsService.getGenericThreat(genericThreatId);

    if (genericThreat === null) {
        next(new NotFoundError("Generic threat not found"));
        return;
    }

    if (genericThreat.projectId !== genericThreatProjectId) {
        next(new BadRequestError("Generic threat does not belong to this project"));
        return;
    }

    response.json(genericThreat);
}

/**
 * Gets all generic threats of the current project that have at least one child threat.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getGenericThreatsWithExtendedChildren(
    request: Request<ProjectIdParam, GenericThreatWithChExtendedChildrenResponse[], void>,
    response: Response<GenericThreatWithChExtendedChildrenResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const genericThreats = await genericThreatsService.getGenericThreatsWithExtendedChildren(projectId);

    response.json(genericThreats);
}
