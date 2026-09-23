/**
 * Module that defines the update-system use case orchestration.
 */
import { db, TransactionType } from "#db/index.js";
import { CatalogThreat, CreateGenericThreat, CreateThreat, GenericThreat, System } from "#db/schema.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { PointOfAttack, UpdateSystemRequest } from "#types/system.types.js";
import { getCatalogThreatsByProjectId } from "#services/catalog-threats.service.js";
import {
    buildThreatForGenericThreat,
    createThreats,
    deleteThreatsByPointOfAttackId,
    getThreatsByProjectId,
} from "#services/threats.service.js";
import {
    createGenericThreats,
    deleteGenericThreatsByPointOfAttackId,
    getGenericThreatsByProjectId,
} from "#services/generic-threats.service.js";
import * as systemService from "#services/system.service.js";

/**
 * Updates a system and synchronizes related threat data.
 *
 * @param {number} projectId - The id of the current project.
 * @param {UpdateSystemRequest} updateSystemData - New system payload.
 * @returns {Promise<System>} A promise that resolves to the updated system.
 */
export async function updateSystem(projectId: number, updateSystemData: UpdateSystemRequest): Promise<System> {
    const oldSystem = await systemService.findSystem(projectId);

    if (!oldSystem) {
        throw new NotFoundError("System not found");
    }

    return await db.transaction(async (tx) => {
        const updatedSystem = await systemService.updateSystem(projectId, updateSystemData, tx);

        await deleteThreatsByPointsOfAttack(getDeletedPointsOfAttack(oldSystem, updatedSystem), projectId, tx);

        const catalogThreats = await getCatalogThreatsByProjectId(projectId, tx);

        await createThreatsByPointsOfAttack(
            getCreatedPointsOfAttack(oldSystem, updatedSystem),
            catalogThreats,
            projectId,
            tx
        );

        await createThreatsForAssetAssignedPointsOfAttack(
            getPointsOfAttackWithAssets(updatedSystem),
            await getGenericThreatsByProjectId(projectId, tx),
            catalogThreats,
            projectId,
            tx
        );

        return updatedSystem;
    });
}

function getDeletedPointsOfAttack(oldSystem: System | undefined, newSystem: System): PointOfAttack[] {
    const oldPointsOfAttack = oldSystem?.data?.pointsOfAttack || [];
    const newPointsOfAttack = newSystem.data?.pointsOfAttack || [];

    return oldPointsOfAttack.filter((oldPointOfAttack) => {
        return !newPointsOfAttack.some((newPointOfAttack) => newPointOfAttack.id === oldPointOfAttack.id);
    });
}

function getCreatedPointsOfAttack(oldSystem: System | undefined, newSystem: System): PointOfAttack[] {
    const oldPointsOfAttack = oldSystem?.data?.pointsOfAttack || [];
    const newPointsOfAttack = newSystem.data?.pointsOfAttack || [];

    return newPointsOfAttack.filter((newPointOfAttack) => {
        return !oldPointsOfAttack.some((oldPointOfAttack) => oldPointOfAttack.id === newPointOfAttack.id);
    });
}

// Returns every point of attack that currently has assets. Child-threat creation is deduplicated
// downstream by an existing-children check, so re-checking asset-bearing points on each update is
// safe and covers points that retain assets but have lost all their children (e.g. remove-then-re-add).
function getPointsOfAttackWithAssets(newSystem: System): PointOfAttack[] {
    const newPointsOfAttack = newSystem.data?.pointsOfAttack || [];

    return newPointsOfAttack.filter((pointOfAttack) => (pointOfAttack.assets?.length ?? 0) > 0);
}

async function deleteThreatsByPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    projectId: number,
    transaction: TransactionType
): Promise<void> {
    for (const pointOfAttack of pointsOfAttack) {
        await deleteGenericThreatsByPointOfAttackId(pointOfAttack.id, projectId, transaction);

        await deleteThreatsByPointOfAttackId(pointOfAttack.id, projectId, transaction);
    }
}

async function createThreatsByPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    catalogThreats: CatalogThreat[],
    projectId: number,
    transaction: TransactionType
): Promise<void> {
    const existingGenericThreats = await getGenericThreatsByProjectId(projectId, transaction);
    const newGenericThreats: CreateGenericThreat[] = [];

    for (const pointOfAttack of pointsOfAttack) {
        const relevantCatalogThreats = catalogThreats.filter(
            (catalogThreat) => catalogThreat.pointOfAttack === pointOfAttack.type
        );

        for (const catalogThreat of relevantCatalogThreats) {
            const {
                id: catalogThreatId,
                name,
                description,
                attacker,
                pointOfAttack: catalogThreatPointOfAttack,
            } = catalogThreat;

            const genericThreat =
                existingGenericThreats.find(
                    (existingThreat) =>
                        existingThreat.catalogThreatId === catalogThreatId &&
                        existingThreat.pointOfAttackId === pointOfAttack.id &&
                        existingThreat.projectId === projectId
                ) ??
                newGenericThreats.find(
                    (newThreat) =>
                        newThreat.catalogThreatId === catalogThreatId && newThreat.pointOfAttackId === pointOfAttack.id
                );

            if (!genericThreat) {
                newGenericThreats.push({
                    projectId,
                    pointOfAttackId: pointOfAttack.id,
                    catalogThreatId,
                    name,
                    description,
                    attacker,
                    pointOfAttack: catalogThreatPointOfAttack,
                });
            }
        }
    }

    if (newGenericThreats.length > 0) {
        await createGenericThreats(newGenericThreats, transaction);
    }
}

async function createThreatsForAssetAssignedPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    genericThreats: GenericThreat[],
    catalogThreats: CatalogThreat[],
    projectId: number,
    transaction: TransactionType
): Promise<void> {
    if (pointsOfAttack.length === 0) {
        return;
    }

    const existingThreats = await getThreatsByProjectId(projectId, transaction);
    const newThreats: CreateThreat[] = [];

    for (const pointOfAttack of pointsOfAttack) {
        const applicableGenericThreats = genericThreats.filter(
            (genericThreat) =>
                genericThreat.pointOfAttackId === pointOfAttack.id && genericThreat.projectId === projectId
        );

        for (const genericThreat of applicableGenericThreats) {
            if (
                existingThreats.some((threat) => threat.genericThreatId === genericThreat.id) ||
                newThreats.some((threat) => threat.genericThreatId === genericThreat.id)
            ) {
                continue;
            }

            const catalogThreat = catalogThreats.find(
                (catalogThreat) => catalogThreat.id === genericThreat.catalogThreatId
            );

            if (!catalogThreat) {
                throw new NotFoundError("Catalog threat not found");
            }

            newThreats.push(buildThreatForGenericThreat(genericThreat, catalogThreat));
        }
    }

    if (newThreats.length > 0) {
        await createThreats(newThreats, transaction);
    }
}
