/**
 * Module that defines the access and manipulation
 * of the measures.
 */
import { asc, eq, ne, and } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { CreateMeasure, Measure, measures, UpdateMeasure } from "#db/schema.js";
import { ConflictError } from "#errors/conflict.error.js";

/**
 * Gets all measures of a project.
 *
 * @param {number} projectId - The id of the current project.
 * @returns {Promise<Measure[]>} A promise that resolves to an array of measures.
 */
export async function getMeasures(projectId: number): Promise<Measure[]> {
    return await db.query.measures.findMany({
        where: eq(measures.projectId, projectId),
        orderBy: [asc(measures.scheduledAt)],
    });
}

/**
 * Gets a measure by its id.
 *
 * @param {number} measureId - The id of the measure.
 * @returns {Promise<Measure | null>} A promise that resolves to the measure or null if not found.
 */
export async function getMeasure(measureId: number): Promise<Measure | null> {
    const measure = await db.query.measures.findFirst({ where: eq(measures.id, measureId) });

    return measure ?? null;
}

/**
 * Creates a measure.
 *
 * @param {CreateMeasure} createMeasureData - The data of the measure.
 * @param {TransactionType} transaction - drizzle transaction.
 * @returns {Promise<Measure>} A promise that resolves to the created measure.
 * @throws {Error} If the measure could not be created.
 */
export async function createMeasure(
    createMeasureData: CreateMeasure,
    transaction: TransactionType | undefined = undefined
): Promise<Measure> {
    const measuresWithDuplicateName = await db.query.measures.findFirst({
        where: and(eq(measures.projectId, createMeasureData.projectId), eq(measures.name, createMeasureData.name)),
    });

    if (measuresWithDuplicateName != null) {
        console.log("called");
        throw new ConflictError("Measure name is not unique");
    }

    const [measure] = await (transaction ?? db).insert(measures).values(createMeasureData).returning();

    if (!measure) {
        throw new Error("Failed to create measure");
    }

    return measure;
}

/**
 * Updates the measure with the specified id.
 *
 * @param {number} projectId - The id of the current project.
 * @param {number} measureId - The id of the measure to update.
 * @param {UpdateMeasure} updateMeasureData - The data of the measure.
 * @returns {Promise<Measure>} A promise that resolves to the updated measure.
 * @throws {Error} If the measure could not be updated.
 */
export async function updateMeasure(
    projectId: number,
    measureId: number,
    updateMeasureData: UpdateMeasure
): Promise<Measure> {
    const measuresWithDuplicateName = await db.query.measures.findFirst({
        where: and(
            eq(measures.projectId, projectId),
            eq(measures.name, updateMeasureData.name),
            ne(measures.id, measureId)
        ),
    });

    if (measuresWithDuplicateName != null) {
        throw new ConflictError("Measure name is not unique");
    }

    const [measure] = await db.update(measures).set(updateMeasureData).where(eq(measures.id, measureId)).returning();

    if (!measure) {
        throw new Error("Failed to update measure");
    }

    return measure;
}

/**
 * Deletes the measure with the specified id.
 *
 * @param {number} measureId - The id of the measure.
 * @returns {Promise<void>} A promise that resolves when the measure is deleted.
 */
export async function deleteMeasure(measureId: number): Promise<void> {
    await db.delete(measures).where(eq(measures.id, measureId));
}
