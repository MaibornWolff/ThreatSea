import { NextFunction, Request, Response } from "express";
import { DATAMODEL_VERSION } from "#dataModelVersion.js";
import { getProject } from "#services/projects.service.js";
import { getAssets } from "#services/assets.service.js";
import { getCatalog } from "#services/catalogs.service.js";
import { getCatalogThreatsByCatalogId } from "#services/catalog-threats.service.js";
import { getCatalogMeasuresByCatalogId } from "#services/catalog-measures.service.js";
import { getComponentTypes } from "#services/component-types.service.js";
import { getMeasures } from "#services/measures.service.js";
import { getMeasureImpactsByProject } from "#services/measureImpacts.service.js";
import { findSystem } from "#services/system.service.js";
import { getThreatsForExport } from "#services/threats.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { ProjectIdParam } from "#types/project.types.js";

/**
 * Exports the specified project and all associated data.
 *
 * @param {Request} request - The http request.
 * @param {Response} response - The http response.
 * @param {NextFunction} next - The next middleware function.
 */
export async function exportProject(
    request: Request<ProjectIdParam>,
    response: Response,
    next: NextFunction
): Promise<void> {
    const projectId: number = request.params.projectId;

    const project = await getProject(projectId, request.user!.id!);

    if (project === null) {
        next(new NotFoundError("Project not found"));
        return;
    }

    const catalogId = project.catalogId;

    const assets = await getAssets(projectId);

    const catalog = await getCatalog(catalogId, request.user!.id!);

    const catalogThreats = await getCatalogThreatsByCatalogId(catalogId);

    const catalogMeasures = await getCatalogMeasuresByCatalogId(catalogId);

    const componentTypes = await getComponentTypes(projectId);

    const measures = await getMeasures(projectId);

    const system = await findSystem(projectId);

    const threats = await getThreatsForExport(projectId);

    const measureImpacts = await getMeasureImpactsByProject(projectId);

    response.json({
        datamodelVersion: DATAMODEL_VERSION,
        project,
        assets,
        system,
        catalog,
        catalogThreats,
        catalogMeasures,
        componentTypes,
        measures,
        threats,
        measureImpacts,
    });
}
