/**
 * Module that defines controller handlers for
 * the system routing.
 */
import { db } from "#db/index.js";
import { CatalogThreat, GenericThreat, System, threats } from "#db/schema.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { getCatalogThreatsByProjectId } from "#services/catalog-threats.service.js";
import {
    createThreatForGenericThreat,
    deleteChildThreatsByPointOfAttackId,
    getChildThreats,
} from "#services/childThreats.service.js";
import {
    createGenericThreat,
    deleteGenericThreatsByPointOfAttackId,
    getGenericThreats,
    getGenericThreatsByProjectId,
} from "#services/genericThreats.service.js";
import * as SystemService from "#services/system.service.js";
import { createThreat } from "#services/threats.service.js";
import { ProjectIdParam } from "#types/project.types.js";
import { PointOfAttack, SystemResponse, UpdateSystemRequest } from "#types/system.types.js";
import { and, eq } from "drizzle-orm";
import { NextFunction, Request, Response } from "express";

// ------------------------------------------------------------------------------
// TODO: Remove legacy threat logic and move non http handling logic to service layer
// ------------------------------------------------------------------------------

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

        await createChildThreatsForAssetAssignedPointsOfAttack(
            getPointsOfAttackWithNewAssets(system, updatedSystem),
            await getGenericThreatsByProjectId(projectId),
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
 * Diffs points of attack and returns those where assets were newly assigned.
 *
 * @param {System} oldSystem - Old system data.
 * @param {System} newSystem - New system data.
 * @returns The points of attack with a first-time asset assignment.
 */
function getPointsOfAttackWithNewAssets(oldSystem: System | undefined, newSystem: System): PointOfAttack[] {
    const oldPointsOfAttack = oldSystem?.data?.pointsOfAttack || [];
    const newPointsOfAttack = newSystem.data?.pointsOfAttack || [];

    return newPointsOfAttack.filter((newPointOfAttack) => {
        const oldPointOfAttack = oldPointsOfAttack.find((pointOfAttack) => pointOfAttack.id === newPointOfAttack.id);
        const oldAssetCount = oldPointOfAttack?.assets?.length ?? 0;
        const newAssetCount = newPointOfAttack.assets?.length ?? 0;

        return oldAssetCount === 0 && newAssetCount > 0;
    });
}

// TODO: Maybe this function should be moved to the service layer?
/**
 * Deletes threats by their point of attack id.
 *
 * @param {array of PointOfAttack} pointsOfAttack - The points of attack
 *     that are not used anymore.
 */
async function deleteThreatsByPointsOfAttack(pointsOfAttack: PointOfAttack[]): Promise<void> {
    for (const pointOfAttack of pointsOfAttack) {
        await deleteGenericThreatsByPointOfAttackId(pointOfAttack.id);

        await deleteChildThreatsByPointOfAttackId(pointOfAttack.id);

        await db
            .delete(threats)
            .where(and(eq(threats.pointOfAttackId, pointOfAttack.id), eq(threats.projectId, pointOfAttack.projectId)));
    }
}

/**
 * Creates new generic threats and legacy threats for the current project
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
    const existingGenericThreats = await getGenericThreats(projectId);

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

            let genericThreat = existingGenericThreats.find(
                (existingThreat) =>
                    existingThreat.catalogThreatId === catalogThreatId &&
                    existingThreat.pointOfAttackId === pointOfAttack.id &&
                    existingThreat.projectId === projectId
            );

            if (!genericThreat) {
                genericThreat = await createGenericThreat({
                    projectId,
                    pointOfAttackId: pointOfAttack.id,
                    catalogThreatId,
                    name,
                    description,
                    attacker,
                    pointOfAttack: catalogThreatPointOfAttack,
                });
                existingGenericThreats.push(genericThreat);
            }
        }
    }
}

/**
 * Ensures that points of attack with newly assigned assets have at least one child threat.
 *
 * @param {array of PointOfAttack} pointsOfAttack - points of attack with newly assigned assets.
 * @param {array of GenericThreat} genericThreats - project generic threats.
 * @param {number} projectId - id of the current project.
 */
async function createChildThreatsForAssetAssignedPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    genericThreats: GenericThreat[],
    projectId: number
): Promise<void> {
    if (pointsOfAttack.length === 0) {
        return;
    }

    for (const pointOfAttack of pointsOfAttack) {
        const applicableGenericThreats = genericThreats.filter(
            (genericThreat) =>
                genericThreat.pointOfAttackId === pointOfAttack.id && genericThreat.projectId === projectId
        );

        for (const genericThreat of applicableGenericThreats) {
            const existingChildThreats = await getChildThreats(genericThreat.id);

            if (existingChildThreats.length > 0) {
                continue;
            }

            await createThreatForGenericThreat(genericThreat.id);
        }
    }
}
