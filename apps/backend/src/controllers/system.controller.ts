/**
 * Module that defines controller handlers for
 * the system routing.
 */
import { NotFoundError } from "#errors/not-found.error.js";
import * as SystemService from "#services/system.service.js";
import * as updateSystemService from "#services/updateSystem.service.js";
import { ProjectIdParam } from "#types/project.types.js";
import { SystemResponse, UpdateSystemRequest } from "#types/system.types.js";
import { NextFunction, Request, Response } from "express";

/**
 * Fetches the current system from the database.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getSystem(
    request: Request<ProjectIdParam, SystemResponse, void>,
    response: Response<SystemResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;

    const system: SystemResponse | null = await SystemService.findSystem(projectId);
    if (!system) {
        next(new NotFoundError("System not found"));
        return;
    }

    response.json(system);
}

/**
 * Saves the current system.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateSystem(
    request: Request<ProjectIdParam, SystemResponse, UpdateSystemRequest>,
    response: Response<SystemResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;

    const data = request.body;
    try {
        const updatedSystem = await updateSystemService.updateSystem(projectId, data);

        response.json(updatedSystem);
    } catch (error) {
        next(error);
    }
}
