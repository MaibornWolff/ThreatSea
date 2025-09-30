import { NextFunction, Request, Response } from "express";
import { checkCatalogExists } from "#services/catalogs.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { checkProjectExists } from "#services/projects.service.js";
import { CatalogIdParam } from "#types/catalog.types.js";
import { ProjectIdParam } from "#types/project.types.js";

/**
 * Middleware function to check the existence of a catalog.
 * This middleware should be called before the authorisation guard to ensure correct error responses.
 *
 * @param request - The http request.
 * @param _response - The http response.
 * @param next - The next middleware function.
 */
export async function CheckCatalogExistenceHandler(
    request: Request<CatalogIdParam>,
    _response: Response,
    next: NextFunction
): Promise<void> {
    const catalogId = request.params.catalogId;

    const exists = await checkCatalogExists(catalogId);
    if (!exists) {
        next(new NotFoundError("Catalog not found"));
        return;
    }

    next();
}

/**
 * Middleware function to check the existence of a project.
 * This middleware should be called before the authorisation guard to ensure correct error responses.
 *
 * @param request - The http request.
 * @param _response - The http response.
 * @param next - The next middleware function.
 */
export async function CheckProjectExistenceHandler(
    request: Request<ProjectIdParam>,
    _response: Response,
    next: NextFunction
): Promise<void> {
    const projectId = request.params.projectId;

    const exists = await checkProjectExists(projectId);
    if (!exists) {
        next(new NotFoundError("Project not found"));
        return;
    }

    next();
}
