/**
 * Module that defines the access and manipulation
 * of generic threats.
 */
import { eq, getTableColumns } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { genericThreats, GenericThreat, CreateGenericThreat, UpdateGenericThreat } from "#db/schema.js";

/**
 * Gets all generic threats of a project.
 *
 * @param {number} projectId - The id of the current project.
 * @returns {Promise<GenericThreat[]>} A promise that resolves to an array of generic threats.
 */
export async function getGenericThreats(projectId: number): Promise<GenericThreat[]> {
    return await db.query.genericThreats.findMany({ where: eq(genericThreats.projectId, projectId) });
}

/**
 * Gets a specific generic threat by its id.
 *
 * @param {number} genericThreatId - The id of the generic threat.
 * @returns {Promise<GenericThreat | null>} A promise that resolves to the generic threat or null if not found.
 */
export async function getGenericThreat(genericThreatId: number): Promise<GenericThreat | null> {
    const genericThreat = await db.query.genericThreats.findFirst({ where: eq(genericThreats.id, genericThreatId) });

    return genericThreat ?? null;
}

export async function getGenericThreatsByProjectId(projectId: number): Promise<GenericThreat[]> {
    return await db
        .select({ ...getTableColumns(genericThreats) })
        .from(genericThreats)
        .where(eq(genericThreats.projectId, projectId));
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

export async function deleteGenericThreatsByPointOfAttackId(pointOfAttackId: string): Promise<void> {
    await db.delete(genericThreats).where(eq(genericThreats.pointOfAttackId, pointOfAttackId));
}
