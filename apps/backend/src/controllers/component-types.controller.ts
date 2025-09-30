/**
 * Module that defines the controller functions
 * for the component routing
 */
import { NextFunction, Request, Response } from "express";
import * as ComponentTypesService from "#services/component-types.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { BadRequestError } from "#errors/bad-request.error.js";
import { ProjectIdParam } from "#types/project.types.js";
import {
    ComponentTypeIdParam,
    ComponentTypeResponse,
    CreateComponentTypeRequest,
    UpdateComponentTypeRequest,
} from "#types/component-type.types.js";

/**
 * Gets the custom components of the specified project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getComponentTypes(
    request: Request<ProjectIdParam, ComponentTypeResponse[], void>,
    response: Response<ComponentTypeResponse[]>
): Promise<void> {
    const projectId = request.params.projectId;

    const componentTypes: ComponentTypeResponse[] = await ComponentTypesService.getComponentTypes(projectId);

    response.json(componentTypes);
}

/**
 * Creates a custom component.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function createComponentType(
    request: Request<ProjectIdParam, ComponentTypeResponse, CreateComponentTypeRequest>,
    response: Response<ComponentTypeResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;

    const data = request.body;
    try {
        const componentType: ComponentTypeResponse = await ComponentTypesService.createComponentType({
            ...data,
            projectId,
        });

        response.json(componentType);
    } catch (error) {
        next(error);
    }
}

/**
 * Updates a custom component.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateComponentType(
    request: Request<ComponentTypeIdParam, ComponentTypeResponse, UpdateComponentTypeRequest>,
    response: Response<ComponentTypeResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const componentTypeId = request.params.componentTypeId;

    const componentType: ComponentTypeResponse | null = await ComponentTypesService.getComponentType(componentTypeId);

    if (componentType === null) {
        next(new NotFoundError("Component Type not found"));
        return;
    }
    if (componentType.projectId !== projectId) {
        next(new BadRequestError("Component Type is not part of this project"));
        return;
    }

    const data = request.body;
    try {
        const updatedComponentType: ComponentTypeResponse = await ComponentTypesService.updateComponentType(
            projectId,
            componentTypeId,
            data
        );

        response.json(updatedComponentType);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes a custom component.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function deleteComponentType(
    request: Request<ComponentTypeIdParam, void, void>,
    response: Response<void>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const componentTypeId = request.params.componentTypeId;

    const componentType: ComponentTypeResponse | null = await ComponentTypesService.getComponentType(componentTypeId);

    if (componentType === null) {
        next(new NotFoundError("Component Type not found"));
        return;
    }
    if (componentType.projectId !== projectId) {
        next(new BadRequestError("Component Type is not part of this project"));
        return;
    }

    await ComponentTypesService.deleteComponentType(componentTypeId);

    response.sendStatus(204);
}
