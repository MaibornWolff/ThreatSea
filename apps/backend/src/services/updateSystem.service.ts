/**
 * Module that defines the update-system use case orchestration.
 */
import { db, TransactionType } from "#db/index.js";
import { CatalogThreat, CreateGenericThreat, CreateThreat, GenericThreat, System } from "#db/schema.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { PointOfAttack, SystemData, UpdateSystemRequest } from "#types/system.types.js";
import { getAssets } from "#services/assets.service.js";
import { getCatalogThreatsByIds, getCatalogThreatsByProjectId } from "#services/catalog-threats.service.js";
import {
    buildThreatForGenericThreat,
    createThreats,
    deleteThreatsByPointOfAttackIds,
    getThreatsByProjectId,
} from "#services/threats.service.js";
import {
    createGenericThreats,
    deleteGenericThreatsByPointOfAttackIds,
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
        const systemUpdate = {
            ...updateSystemData,
            data: await keepProjectAssetIds(projectId, updateSystemData.data, tx),
        };
        const updatedSystem = await systemService.updateSystem(projectId, systemUpdate, tx);

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

// Drops asset ids of other projects and of deleted assets. A deleted asset stays in the diagram,
// so rejecting unknown ids would break normal saves.
async function keepProjectAssetIds(
    projectId: number,
    data: SystemData | null,
    transaction: TransactionType
): Promise<SystemData | null> {
    if (!data?.pointsOfAttack) {
        return data;
    }

    const projectAssetIds = new Set((await getAssets(projectId, transaction)).map((asset) => asset.id));

    return {
        ...data,
        pointsOfAttack: data.pointsOfAttack.map((pointOfAttack) => ({
            ...pointOfAttack,
            assets: Array.isArray(pointOfAttack.assets)
                ? pointOfAttack.assets.filter((assetId) => projectAssetIds.has(assetId))
                : [],
        })),
    };
}

function getDeletedPointsOfAttack(oldSystem: System | undefined, newSystem: System): PointOfAttack[] {
    const oldPointsOfAttack = oldSystem?.data?.pointsOfAttack || [];
    const newPointOfAttackIds = new Set(
        (newSystem.data?.pointsOfAttack || []).map((pointOfAttack) => pointOfAttack.id)
    );

    return oldPointsOfAttack.filter((oldPointOfAttack) => !newPointOfAttackIds.has(oldPointOfAttack.id));
}

function getCreatedPointsOfAttack(oldSystem: System | undefined, newSystem: System): PointOfAttack[] {
    const oldPointOfAttackIds = new Set(
        (oldSystem?.data?.pointsOfAttack || []).map((pointOfAttack) => pointOfAttack.id)
    );
    const newPointsOfAttack = newSystem.data?.pointsOfAttack || [];

    return newPointsOfAttack.filter((newPointOfAttack) => !oldPointOfAttackIds.has(newPointOfAttack.id));
}

function genericThreatKey(catalogThreatId: number, pointOfAttackId: string): string {
    return `${catalogThreatId}|${pointOfAttackId}`;
}

// Returns every point of attack that currently has assets. Threat creation is deduplicated
// downstream by an existing-threats check, so re-checking asset-bearing points on each update is
// safe and covers points that retain assets but have lost all their threats (e.g. remove-then-re-add).
function getPointsOfAttackWithAssets(newSystem: System): PointOfAttack[] {
    const newPointsOfAttack = newSystem.data?.pointsOfAttack || [];

    return newPointsOfAttack.filter((pointOfAttack) => (pointOfAttack.assets?.length ?? 0) > 0);
}

async function deleteThreatsByPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    projectId: number,
    transaction: TransactionType
): Promise<void> {
    const pointOfAttackIds = pointsOfAttack.map((pointOfAttack) => pointOfAttack.id);

    await deleteGenericThreatsByPointOfAttackIds(pointOfAttackIds, projectId, transaction);

    await deleteThreatsByPointOfAttackIds(pointOfAttackIds, projectId, transaction);
}

async function createThreatsByPointsOfAttack(
    pointsOfAttack: PointOfAttack[],
    catalogThreats: CatalogThreat[],
    projectId: number,
    transaction: TransactionType
): Promise<void> {
    const knownGenericThreatKeys = new Set(
        (await getGenericThreatsByProjectId(projectId, transaction))
            .filter((genericThreat) => genericThreat.projectId === projectId)
            .map((genericThreat) => genericThreatKey(genericThreat.catalogThreatId, genericThreat.pointOfAttackId))
    );
    const catalogThreatsByPointOfAttackType = Map.groupBy<string, CatalogThreat>(
        catalogThreats,
        (catalogThreat) => catalogThreat.pointOfAttack
    );
    const newGenericThreats: CreateGenericThreat[] = [];

    for (const pointOfAttack of pointsOfAttack) {
        const relevantCatalogThreats = catalogThreatsByPointOfAttackType.get(pointOfAttack.type) ?? [];

        for (const catalogThreat of relevantCatalogThreats) {
            const {
                id: catalogThreatId,
                name,
                description,
                attacker,
                pointOfAttack: catalogThreatPointOfAttack,
            } = catalogThreat;

            const key = genericThreatKey(catalogThreatId, pointOfAttack.id);

            if (!knownGenericThreatKeys.has(key)) {
                knownGenericThreatKeys.add(key);
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

    const genericThreatIdsWithThreat = new Set(
        (await getThreatsByProjectId(projectId, transaction)).map((threat) => threat.genericThreatId)
    );
    const catalogThreatsById = await mapCatalogThreatsOfGenericThreats(genericThreats, catalogThreats, transaction);
    const genericThreatsByPointOfAttackId = Map.groupBy(
        genericThreats.filter((genericThreat) => genericThreat.projectId === projectId),
        (genericThreat) => genericThreat.pointOfAttackId
    );
    const newThreats: CreateThreat[] = [];

    for (const pointOfAttack of pointsOfAttack) {
        for (const genericThreat of genericThreatsByPointOfAttackId.get(pointOfAttack.id) ?? []) {
            if (genericThreatIdsWithThreat.has(genericThreat.id)) {
                continue;
            }
            genericThreatIdsWithThreat.add(genericThreat.id);

            const catalogThreat = catalogThreatsById.get(genericThreat.catalogThreatId);

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

/**
 * The catalog threats of the given generic threats, by id. Generic threats reference their
 * catalog threat by id rather than through the project's catalog, so any not in the project's
 * catalog threats are looked up by id in one query instead of failing the whole system save.
 */
async function mapCatalogThreatsOfGenericThreats(
    genericThreats: GenericThreat[],
    projectCatalogThreats: CatalogThreat[],
    transaction: TransactionType
): Promise<Map<number, CatalogThreat>> {
    const catalogThreatsById = new Map(projectCatalogThreats.map((catalogThreat) => [catalogThreat.id, catalogThreat]));
    const missingCatalogThreatIds = [
        ...new Set(
            genericThreats
                .map((genericThreat) => genericThreat.catalogThreatId)
                .filter((catalogThreatId) => !catalogThreatsById.has(catalogThreatId))
        ),
    ];
    for (const catalogThreat of await getCatalogThreatsByIds(missingCatalogThreatIds, transaction)) {
        catalogThreatsById.set(catalogThreat.id, catalogThreat);
    }
    return catalogThreatsById;
}
