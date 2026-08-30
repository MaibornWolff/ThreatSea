/**
 * Module that defines the controller functions for
 * the generic threat routing.
 */
import { Request, Response } from "express";
import { GenericThreatWithExtendedChildrenResponse } from "#types/generic-threat.types.js";
import { ProjectIdParam } from "#types/project.types.js";
import * as genericThreatsService from "#services/generic-threats.service.js";

/**
 * Gets all generic threats of the current project that have at least one child threat.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getGenericThreatsWithExtendedChildren(
    request: Request<ProjectIdParam, GenericThreatWithExtendedChildrenResponse[], void>,
    response: Response<GenericThreatWithExtendedChildrenResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const genericThreats = await genericThreatsService.getGenericThreatsWithExtendedChildren(projectId);

    response.json(genericThreats);
}
