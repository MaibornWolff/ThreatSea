/**
 * Module that defines the controller functions
 * for the routes of the projects.
 */
import { NextFunction, Request, Response } from "express";
import * as ProjectsService from "#services/projects.service.js";
import { getCatalog } from "#services/catalogs.service.js";
import { createEmptySystem } from "#services/system.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import {
    CreateProjectRequest,
    ExtendedProjectResponse,
    ProjectIdParam,
    ProjectResponse,
    UpdateProjectRequest,
} from "#types/project.types.js";

/**
 * Generates the data for a report.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function generateReport(request: Request<ProjectIdParam>, response: Response): Promise<void> {
    const projectId = request.params.projectId;

    const data = await ProjectsService.getReportData(projectId);

    response.json(data);
}

/**
 * Gets all projects of the user.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function getProjects(
    request: Request<void, ExtendedProjectResponse[], void>,
    response: Response<ExtendedProjectResponse[]>
): Promise<void> {
    const projects: ExtendedProjectResponse[] = await ProjectsService.getProjects(request.user!.id!);

    response.json(projects);
}

/**
 * Gets the project with the specified id.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function getProject(
    request: Request<ProjectIdParam, ExtendedProjectResponse, void>,
    response: Response<ExtendedProjectResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;

    const project: ExtendedProjectResponse | null = await ProjectsService.getProject(projectId, request.user!.id!);
    if (project === null) {
        next(new NotFoundError("Project not found"));
        return;
    }

    response.json(project);
}

/**
 * Creates a new project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function createProject(
    request: Request<void, ProjectResponse, CreateProjectRequest>,
    response: Response<ProjectResponse>,
    next: NextFunction
): Promise<void> {
    const userId = request.user!.id!;
    const data = request.body;

    const catalog = await getCatalog(data.catalogId, userId);
    if (catalog === undefined) {
        next(new NotFoundError("Catalog not found"));
        return;
    }

    try {
        const project: ProjectResponse = await ProjectsService.createProject(userId, data);
        await createEmptySystem(project.id);

        response.json(project);
    } catch (error) {
        next(error);
    }
}

/**
 * Updates the specified project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function updateProject(
    request: Request<ProjectIdParam, ProjectResponse, UpdateProjectRequest>,
    response: Response<ProjectResponse>,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;
    const data = request.body;

    try {
        const project: ProjectResponse = await ProjectsService.updateProject(projectId, data);

        response.json(project);
    } catch (error) {
        next(error);
    }
}

/**
 * Deletes the specified project.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 */
export async function deleteProject(
    request: Request<ProjectIdParam, void, void>,
    response: Response<void>
): Promise<void> {
    const projectId = request.params.projectId;

    await ProjectsService.deleteProject(projectId);

    response.sendStatus(204);
}
