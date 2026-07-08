/**
 * Module that defines the update-system use case orchestration.
 */
import { db, TransactionType } from "#db/index.js";
import { CatalogThreat, GenericThreat, System } from "#db/schema.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { PointOfAttack, UpdateSystemRequest } from "#types/system.types.js";
import { getCatalogThreatsByProjectId } from "#services/catalog-threats.service.js";
import {
    createThreatForGenericThreat,
    deleteChildThreatsByPointOfAttackId,
    getChildThreatsByGenericThreatId,
} from "#services/childThreats.service.js";
import {
    createGenericThreat,
    deleteGenericThreatsByPointOfAttackId,
    getGenericThreatsByProjectId,
} from "#services/genericThreats.service.js";
import * as systemService from "#services/system.service.js";

/**
 * Update system edge cases which are probably not covered
 *  only oldAssetCount === 0 and newAssetCount > 0 is the logic in place for generating child threats, this does not take following cases into account:
 * - asset is removed and a new asset is added to the same point of attack (oldAssetCount > 0 and newAssetCount > 0)
 *  - all assets are removed and new assets are added to the same point of attack (oldAssetCount > 0 and newAssetCount > 0)
 */

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

        await deleteThreatsByPointsOfAttack(getDeletedPointsOfAttack(oldSystem, updatedSystem), tx);

        await createThreatsByPointsOfAttack(
            getCreatedPointsOfAttack(oldSystem, updatedSystem),
            await getCatalogThreatsByProjectId(projectId, tx),
            projectId,
            tx
        );

        await createChildThreatsForAssetAssignedPointsOfAttack(
            getPointsOfAttackWithNewAssets(oldSystem, updatedSystem),
            await getGenericThreatsByProjectId(projectId, tx),
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

async function deleteThreatsByPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    transaction: TransactionType
): Promise<void> {
    for (const pointOfAttack of pointsOfAttack) {
        await deleteGenericThreatsByPointOfAttackId(pointOfAttack.id, pointOfAttack.projectId, transaction);

        await deleteChildThreatsByPointOfAttackId(pointOfAttack.id, pointOfAttack.projectId, transaction);
    }
}

async function createThreatsByPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    catalogThreats: CatalogThreat[],
    projectId: number,
    transaction: TransactionType
): Promise<void> {
    const existingGenericThreats = await getGenericThreatsByProjectId(projectId, transaction);

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

            let genericThreat = existingGenericThreats.find(
                (existingThreat) =>
                    existingThreat.catalogThreatId === catalogThreatId &&
                    existingThreat.pointOfAttackId === pointOfAttack.id &&
                    existingThreat.projectId === projectId
            );

            if (!genericThreat) {
                genericThreat = await createGenericThreat(
                    {
                        projectId,
                        pointOfAttackId: pointOfAttack.id,
                        catalogThreatId,
                        name,
                        description,
                        attacker,
                        pointOfAttack: catalogThreatPointOfAttack,
                    },
                    transaction
                );
                existingGenericThreats.push(genericThreat);
            }
        }
    }
}

async function createChildThreatsForAssetAssignedPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    genericThreats: GenericThreat[],
    projectId: number,
    transaction: TransactionType
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
            const existingChildThreats = await getChildThreatsByGenericThreatId(genericThreat.id, transaction);

            if (existingChildThreats.length > 0) {
                continue;
            }

            await createThreatForGenericThreat(genericThreat.id, transaction);
        }
    }
}
