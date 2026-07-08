/**
 * Module that defines the access and manipulation
 * of generic threats.
 */
import { and, eq, getTableColumns } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { genericThreats, GenericThreat, CreateGenericThreat, UpdateGenericThreat } from "#db/schema.js";
import { GenericThreatWithExtendedChildrenResponse } from "#types/genericThreat.types.js";
import { getPointsOfAttack } from "#services/points-of-attack.service.js";
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";

/**
 * Gets a specific generic threat by its id.
 *
 * @param {number} genericThreatId - The id of the generic threat.
 * @returns {Promise<GenericThreat | null>} A promise that resolves to the generic threat or null if not found.
 */
export async function getGenericThreat(
    genericThreatId: number,
    transaction: TransactionType | undefined = undefined
): Promise<GenericThreat | null> {
    const genericThreat = await (transaction ?? db).query.genericThreats.findFirst({
        where: eq(genericThreats.id, genericThreatId),
    });

    return genericThreat ?? null;
}

/**
 * Gets all generic threats of a project.
 *
 * @param {number} projectId - The id of the current project.
 * @returns {Promise<GenericThreat[]>} A promise that resolves to an array of generic threats.
 */
export async function getGenericThreatsByProjectId(
    projectId: number,
    transaction: TransactionType | undefined = undefined
): Promise<GenericThreat[]> {
    return await (transaction ?? db)
        .select({ ...getTableColumns(genericThreats) })
        .from(genericThreats)
        .where(eq(genericThreats.projectId, projectId));
}

export async function getGenericThreatsWithExtendedChildren(
    projectId: number
): Promise<GenericThreatWithExtendedChildrenResponse[]> {
    const genericThreatsWithExtendedChildren = await db.query.genericThreats.findMany({
        where: eq(genericThreats.projectId, projectId),
        with: {
            childThreats: true,
        },
    });

    const pointsOfAttack = await getPointsOfAttack(projectId);
    const pointsOfAttackById = new Map(pointsOfAttack.map((pointOfAttack) => [pointOfAttack.id, pointOfAttack]));

    return genericThreatsWithExtendedChildren
        .filter((genericThreat) => genericThreat.childThreats.length > 0)
        .map(({ childThreats, ...genericThreat }) => ({
            ...genericThreat,
            children: childThreats.map((childThreat) => {
                const pointOfAttack = pointsOfAttackById.get(childThreat.pointOfAttackId);
                const interfaceName =
                    pointOfAttack?.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES
                        ? (pointOfAttack.name ?? null)
                        : null;

                return {
                    ...childThreat,
                    componentName: pointOfAttack?.componentName ?? null,
                    componentType: pointOfAttack?.componentType ?? null,
                    interfaceName,
                    assets: pointOfAttack?.assets ?? [],
                };
            }),
        }));
}

/**
 * Creates a generic threat.
 *
 * @param {CreateGenericThreat} createGenericThreatData - The data of the generic threat.
 * @param {TransactionType} transaction - drizzle transaction.
 * @returns {Promise<GenericThreat>} A promise that resolves to the created generic threat.
 * @throws {Error} If the generic threat could not be created.
 */
export async function createGenericThreat(
    createGenericThreatData: CreateGenericThreat,
    transaction: TransactionType | undefined = undefined
): Promise<GenericThreat> {
    const [genericThreat] = await (transaction ?? db)
        .insert(genericThreats)
        .values(createGenericThreatData)
        .returning();

    if (!genericThreat) {
        throw new Error("Failed to create generic threat");
    }

    return genericThreat;
}

/**
 * Updates the generic threat with the specified id.
 *
 * @param {number} genericThreatId - The id of the generic threat.
 * @param {UpdateGenericThreat} updateGenericThreatData - The data of the generic threat.
 * @returns {Promise<GenericThreat>} A promise that resolves to the updated generic threat.
 * @throws {Error} If the generic threat could not be updated.
 */
export async function updateGenericThreat(
    genericThreatId: number,
    updateGenericThreatData: UpdateGenericThreat
): Promise<GenericThreat> {
    const [genericThreat] = await db
        .update(genericThreats)
        .set(updateGenericThreatData)
        .where(eq(genericThreats.id, genericThreatId))
        .returning();

    if (!genericThreat) {
        throw new Error("Failed to update generic threat");
    }

    return genericThreat;
}

/**
 * Deletes the generic threat with the specified id.
 *
 * @param {number} genericThreatId - The id of the generic threat.
 * @returns {Promise<void>} A promise that resolves when the generic threat is deleted.
 */
export async function deleteGenericThreat(genericThreatId: number): Promise<void> {
    await db.delete(genericThreats).where(eq(genericThreats.id, genericThreatId));
}

// used to delete obsolete generic threats, maybe it should not only check for pointOfAttackId but also for projectId to be more precise

export async function deleteGenericThreatsByPointOfAttackId(
    pointOfAttackId: string,
    projectId: number,
    transaction: TransactionType | undefined = undefined
): Promise<void> {
    await (transaction ?? db)
        .delete(genericThreats)
        .where(and(eq(genericThreats.pointOfAttackId, pointOfAttackId), eq(genericThreats.projectId, projectId)));
}
