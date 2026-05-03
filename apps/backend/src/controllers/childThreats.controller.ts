/**
 * Module that defines the controller functions for
 * the child threat routing.
 */
import { NextFunction, Request, Response } from "express";
import { BadRequestError } from "#errors/bad-request.error.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { ChildThreatIdParam, ChildThreatResponse, CreateChildThreatRequest, UpdateChildThreatRequest } from "#types/childThreat.types.js";
import { GenericThreatIdParam } from "#types/genericThreat.types.js";
import * as childThreatsService from "#services/childThreats.service.js";
import * as genericThreatsService from "#services/genericThreats.service.js";

/**
 * Gets all child threats for the specified generic threat.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getChildThreatsByGenericThreatId(
    request: Request<GenericThreatIdParam, ChildThreatResponse[], void>,
    response: Response<ChildThreatResponse[]>,
    next: NextFunction
): Promise<void> {
    const genericThreatProjectId = request.params.projectId;
    const genericThreatId = request.params.genericThreatId;
    const childThreats = await childThreatsService.getChildThreatsByGenericThreatId(genericThreatId);
    const genericThreat = await genericThreatsService.getGenericThreat(genericThreatId);

    if (genericThreat === null) {
        next(new NotFoundError("Generic threat not found"));
        return;
    }

    if (genericThreat.projectId !== genericThreatProjectId) {
        next(new BadRequestError("Generic threat does not belong to this project"));
        return;
    }

    // TODO: Is this check necessary? If so, is this the right error to throw?
    // Copilot suggests empty list with 200 as response
    if (childThreats.length === 0) {
        next(new NotFoundError("Child threats not found"));
        return;
    }

    response.json(childThreats);
}

/**
 * Gets the child threat by the specified id.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getChildThreat(
    request: Request<ChildThreatIdParam, ChildThreatResponse, void>,
    response: Response<ChildThreatResponse>,
    next: NextFunction
): Promise<void> {
    const childThreatId = request.params.childThreatId;
    const childThreatProjectId = request.params.projectId;

    const childThreat = await childThreatsService.getChildThreat(childThreatId);

    if (childThreat === null) {
        next(new NotFoundError("Child threat not found"));
        return;
    }

    if (childThreat.projectId !== childThreatProjectId) {
        next(new BadRequestError("Child threat does not belong to this project"));
        return;
    }

    response.json(childThreat);
}

/**
 * Creates a new child threat.
 */
export async function createChildThreat(
    request: Request<GenericThreatIdParam, ChildThreatResponse, CreateChildThreatRequest>,
    response: Response<ChildThreatResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const genericThreatId = request.params.genericThreatId;
    const createBody = request.body as any;

    try {
        // Ensure generic threat exists and belongs to project
        const genericThreat = await genericThreatsService.getGenericThreat(genericThreatId);
        if (genericThreat === null) {
            next(new NotFoundError("Generic threat not found"));
            return;
        }

        if (genericThreat.projectId !== projectId) {
            next(new BadRequestError("Generic threat does not belong to this project"));
            return;
        }

        // If body contains genericThreatId, ensure it matches the URL param
        if (createBody.genericThreatId && createBody.genericThreatId !== genericThreatId) {
            next(new BadRequestError("genericThreatId in body does not match url"));
            return;
        }

        const created = await childThreatsService.createChildThreat({
            ...createBody,
            genericThreatId,
            projectId,
        });

        response.status(201).json(created);
    } catch (err) {
        next(err);
    }
}

/**
 * Updates an existing child threat.
 */
export async function updateChildThreat(
    request: Request<ChildThreatIdParam, ChildThreatResponse, UpdateChildThreatRequest>,
    response: Response<ChildThreatResponse>,
    next: NextFunction
): Promise<void> {
    const childThreatId = request.params.childThreatId;
    const projectId = request.params.projectId;
    const updateBody = request.body as any;

    try {
        const existing = await childThreatsService.getChildThreat(childThreatId);
        if (existing === null) {
            next(new NotFoundError("Child threat not found"));
            return;
        }

        if (existing.projectId !== projectId) {
            next(new BadRequestError("Child threat does not belong to this project"));
            return;
        }

        const updated = await childThreatsService.updateChildThreat(childThreatId, updateBody);

        response.json(updated);
    } catch (err) {
        next(err);
    }
}

/**
 * Deletes a child threat.
 */
export async function deleteChildThreat(
    request: Request<ChildThreatIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const childThreatId = request.params.childThreatId;
    const projectId = request.params.projectId;

    try {
        const existing = await childThreatsService.getChildThreat(childThreatId);
        if (existing === null) {
            next(new NotFoundError("Child threat not found"));
            return;
        }

        if (existing.projectId !== projectId) {
            next(new BadRequestError("Child threat does not belong to this project"));
            return;
        }

        await childThreatsService.deleteChildThreat(childThreatId);

        response.status(204).end();
    } catch (err) {
        next(err);
    }
}
