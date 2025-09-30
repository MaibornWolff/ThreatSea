/**
 * Module that defines the logic for
 * manipulating a system entry.
 */
import { asc, eq } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { System, systems, UpdateSystem } from "#db/schema.js";

/**
 * Gets a specific system by the project id.
 *
 * @param {number} projectId - The id of the project.
 * @returns {Promise<System | null>} A promise that resolves to the system or null if not found.
 */
export async function findSystem(projectId: number): Promise<System | null> {
    const system = await db.query.systems.findFirst({
        where: eq(systems.projectId, projectId),
        orderBy: [asc(systems.projectId)],
    });

    return system ?? null;
}

/**
 * Creates an empty system for the specified project.
 *
 * @param projectId - The id of the project.
 * @param transaction - drizzle transaction.
 * @returns {Promise<System>} A promise that resolves to the created system.
 * @throws {Error} If the system could not be created.
 */
export async function createEmptySystem(
    projectId: number,
    transaction: TransactionType | undefined = undefined
): Promise<System> {
    const [system] = await (transaction ?? db)
        .insert(systems)
        .values({
            projectId,
            data: null,
            image: null,
        })
        .returning();

    if (!system) {
        throw new Error("Failed to create system");
    }

    return system;
}

/**
 * Saves a system if any changes happened.
 *
 * @param {number} projectId - The id of the project.
 * @param {UpdateSystem} updateSystemData - The data of the system.
 * @param transaction - drizzle transaction
 * @returns {Promise<System>} A promise that resolves to the updated system.
 */
export async function updateSystem(
    projectId: number,
    updateSystemData: UpdateSystem,
    transaction: TransactionType | undefined = undefined
): Promise<System> {
    const [system] = await (transaction ?? db)
        .update(systems)
        .set(updateSystemData)
        .where(eq(systems.projectId, projectId))
        .returning();

    if (!system) {
        throw new Error("Failed to update system");
    }

    return system;
}
