/**
 * Module that defines the controller functions for
 * the generic threat and threat routing.
 */
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "#errors/bad-request.error.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { ThreatIdParam, ThreatResponse, CreateThreatRequest, UpdateThreatRequest } from "#types/threat.types.js";
import { GenericThreatIdParam, GenericThreatWithExtendedThreatsResponse } from "#types/generic-threat.types.js";
import { ProjectIdParam } from "#types/project.types.js";
import * as threatsService from "#services/threats.service.js";
import * as genericThreatsService from "#services/generic-threats.service.js";

/**
 * Gets all generic threats of the current project that have at least one threat.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getGenericThreatsWithExtendedThreats(
    request: Request<ProjectIdParam, GenericThreatWithExtendedThreatsResponse[], void>,
    response: Response<GenericThreatWithExtendedThreatsResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const genericThreats = await genericThreatsService.getGenericThreatsWithExtendedThreats(projectId);

    response.json(genericThreats);
}

/**
 * Gets all threats for the specified generic threat.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getThreatsByGenericThreatId(
    request: Request<GenericThreatIdParam, ThreatResponse[], void>,
    response: Response<ThreatResponse[]>,
    next: NextFunction
): Promise<void> {
    const genericThreatProjectId = request.params.projectId;
    const genericThreatId = request.params.genericThreatId;
    const genericThreat = await genericThreatsService.getGenericThreat(genericThreatId);

    if (genericThreat === null) {
        next(new NotFoundError("Generic threat not found"));
        return;
    }

    if (genericThreat.projectId !== genericThreatProjectId) {
        next(new BadRequestError("Generic threat does not belong to this project"));
        return;
    }

    const threats = await threatsService.getThreatsByGenericThreatId(genericThreatId);

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
    const threatId = request.params.threatId;
    const threatProjectId = request.params.projectId;

    const threat = await threatsService.getThreat(threatId);

    if (threat === null) {
        next(new NotFoundError("Threat not found"));
        return;
    }

    if (threat.projectId !== threatProjectId) {
        next(new BadRequestError("Threat does not belong to this project"));
        return;
    }

    response.json(threat);
}

/**
 * Creates a new threat.
 */
export async function createThreat(
    request: Request<GenericThreatIdParam, ThreatResponse, CreateThreatRequest>,
    response: Response<ThreatResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const createBody = request.body;
    const genericThreatId = request.params.genericThreatId;

    try {
        const genericThreat = await genericThreatsService.getGenericThreat(genericThreatId);
        if (genericThreat === null) {
            next(new NotFoundError("Generic threat not found"));
            return;
        }

        if (genericThreat.projectId !== projectId) {
            next(new BadRequestError("Generic threat does not belong to this project"));
            return;
        }

        // The body carries only optional refinement overrides; identity is inherited
        // from the immutable generic threat (and assessment defaults from the catalogue threat)
        // and cannot be chosen by the client.
        const created = await threatsService.createThreatForGenericThreat(genericThreatId, createBody);

        response.status(201).json(created);
    } catch (err) {
        next(err);
    }
}

/**
 * Updates an existing threat.
 */
export async function updateThreat(
    request: Request<ThreatIdParam, ThreatResponse, UpdateThreatRequest>,
    response: Response<ThreatResponse>,
    next: NextFunction
): Promise<void> {
    const threatId = request.params.threatId;
    const projectId = request.params.projectId;
    const updateBody = request.body;

    try {
        const existing = await threatsService.getThreat(threatId);
        if (existing === null) {
            next(new NotFoundError("Threat not found"));
            return;
        }

        if (existing.projectId !== projectId) {
            next(new BadRequestError("Threat does not belong to this project"));
            return;
        }

        // Pass only the refinement fields; anything else in the body (e.g. identity
        // fields) must not reach the database update.
        const updated = await threatsService.updateThreat(threatId, {
            name: updateBody.name,
            description: updateBody.description,
            probability: updateBody.probability,
            confidentiality: updateBody.confidentiality,
            integrity: updateBody.integrity,
            availability: updateBody.availability,
            status: updateBody.status,
        });

        response.json(updated);
    } catch (err) {
        next(err);
    }
}

/**
 * Deletes a threat.
 */
export async function deleteThreat(
    request: Request<ThreatIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const threatId = request.params.threatId;
    const projectId = request.params.projectId;

    try {
        const existing = await threatsService.getThreat(threatId);
        if (existing === null) {
            next(new NotFoundError("Threat not found"));
            return;
        }

        if (existing.projectId !== projectId) {
            next(new BadRequestError("Threat does not belong to this project"));
            return;
        }

        await threatsService.deleteThreat(threatId);

        response.status(204).end();
    } catch (err) {
        next(err);
    }
}
