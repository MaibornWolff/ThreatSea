/**
 * Module that defines the controlling function for
 * the system routing.
 */
import { NextFunction, Request, Response } from "express";
import { and, eq, getTableColumns } from "drizzle-orm";
import { PointOfAttack, SystemResponse, UpdateSystemRequest } from "#types/system.types.js";
import { db } from "#db/index.js";
import { catalogs, CatalogThreat, catalogThreats, projects, System, threats } from "#db/schema.js";
import * as SystemService from "#services/system.service.js";
import { createThreat } from "#services/threats.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { ProjectIdParam } from "#types/project.types.js";

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

    const system = await SystemService.findSystem(projectId);
    if (!system) {
        next(new NotFoundError("System not found"));
        return;
    }

    const data = request.body;
    try {
        const updatedSystem = await SystemService.updateSystem(projectId, data);

        await deleteThreatsByPointsOfAttack(getDeletedPointsOfAttack(system, updatedSystem));

        await createThreatsByPointsOfAttack(
            getCreatedPointsOfAttack(system, updatedSystem),
            await getCatalogThreatsByProjectId(projectId),
            projectId
        );

        response.json(updatedSystem);
    } catch (error) {
        next(error);
    }
}

/**
 * Diffs the new system with the old system
 * and checks which points of attack got deleted.
 *
 * @param {System} oldSystem - Old system data.
 * @param {System} newSystem - New system data.
 * @returns An Array of removed attack points.
 */
function getDeletedPointsOfAttack(oldSystem: System | undefined, newSystem: System): PointOfAttack[] {
    const oldPointsOfAttack = oldSystem?.data?.pointsOfAttack || [];
    const newPointsOfAttack = newSystem.data?.pointsOfAttack || [];

    return oldPointsOfAttack.filter((oldPointOfAttack) => {
        return !newPointsOfAttack.some((newPointsOfAttack) => newPointsOfAttack.id === oldPointOfAttack.id);
    });
}

/**
 * Diffs the new system with the old system
 * and checks whether new points of attack got added.
 *
 * @param {System} oldSystem - Old system data.
 * @param {System} newSystem - New system data.
 * @returns The new points of attack.
 */
function getCreatedPointsOfAttack(oldSystem: System | undefined, newSystem: System): PointOfAttack[] {
    const oldPointsOfAttack = oldSystem?.data?.pointsOfAttack || [];
    const newPointsOfAttack = newSystem.data?.pointsOfAttack || [];

    return newPointsOfAttack.filter((newPointsOfAttack) => {
        return !oldPointsOfAttack.some((oldPointOfAttack) => oldPointOfAttack.id === newPointsOfAttack.id);
    });
}

/**
 * Gets the threads of the current catalogue used.
 *
 * @param {number} projectId - id of the current project.
 * @returns Array of threads from the database.
 */
async function getCatalogThreatsByProjectId(projectId: number): Promise<CatalogThreat[]> {
    return await db
        .select({ ...getTableColumns(catalogThreats) })
        .from(catalogThreats)
        .innerJoin(catalogs, eq(catalogThreats.catalogId, catalogs.id))
        .innerJoin(projects, eq(projects.catalogId, catalogs.id))
        .where(eq(projects.id, projectId));
}

/**
 * Deletes threats by their point of attack id.
 *
 * @param {array of object} pointsOfAttack - The points of attack
 *     that are not used anymore.
 */
async function deleteThreatsByPointsOfAttack(pointsOfAttack: PointOfAttack[]): Promise<void> {
    for (const pointOfAttack of pointsOfAttack) {
        await db
            .delete(threats)
            .where(and(eq(threats.pointOfAttackId, pointOfAttack.id), eq(threats.projectId, pointOfAttack.projectId)));
    }
}

/**
 * Creates new threats inside the database for the current project
 * based on the new points of attack.
 *
 * @param {array of PointOfAttack} pointsOfAttack - The new points of attack
 *     created in the system.
 * @param {array of CatalogThreat} catalogThreats - The threats defined
 *     in the catalogue of the project.
 * @param {number} projectId - id of the current project
 */
async function createThreatsByPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    catalogThreats: CatalogThreat[],
    projectId: number
): Promise<void> {
    for (const pointOfAttack of pointsOfAttack) {
        const relevantCatalogThreats = catalogThreats.filter(
            (catalogThreat) => catalogThreat.pointOfAttack === pointOfAttack.type
        );

        for (const catalogThreat of relevantCatalogThreats) {
            const {
                id: catalogThreatId,
                name,
                description,
                probability,
                attacker,
                confidentiality,
                integrity,
                availability,
                pointOfAttack: catalogThreatPointOfAttack,
            } = catalogThreat;

            await createThreat({
                projectId,
                pointOfAttackId: pointOfAttack.id,
                catalogThreatId,
                name,
                description,
                attacker,
                pointOfAttack: catalogThreatPointOfAttack,
                probability,
                confidentiality,
                integrity,
                availability,
                doneEditing: false,
            });
        }
    }
}
