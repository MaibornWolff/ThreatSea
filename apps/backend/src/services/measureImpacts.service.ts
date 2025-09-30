/**
 * Module that defines the access and manipulation
 * for the MeasureImpact of a project.
 */
import { eq, getTableColumns, inArray } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { CreateMeasureImpact, MeasureImpact, measureImpacts, measures, UpdateMeasureImpact } from "#db/schema.js";

/**
 * Gets all measure impacts of the specified project.
 *
 * @param {number} projectId - The id of the current project.
 * @returns {Promise<MeasureImpact[]>} A promise that resolves to an array of measure impacts.
 */
export async function getMeasureImpactsByProject(projectId: number): Promise<MeasureImpact[]> {
    return await db
        .select({ ...getTableColumns(measureImpacts) })
        .from(measures)
        .innerJoin(measureImpacts, eq(measures.id, measureImpacts.measureId))
        .where(eq(measures.projectId, projectId));
}

/**
 * Gets a specific measure impact by its id.
 *
 * @param {number} measureImpactId - The id of the asset.
 * @returns {Promise<MeasureImpact | null>} A promise that resolves to the measure impact or null if not found.
 */
export async function getMeasureImpact(measureImpactId: number): Promise<MeasureImpact | null> {
    const measureImpact = await db.query.measureImpacts.findFirst({ where: eq(measureImpacts.id, measureImpactId) });

    return measureImpact ?? null;
}

/**
 * Gets multiple measure impacts by their ids.
 *
 * @param {number[]} measureImpactIds - The ids of the measure impacts.
 * @return {Promise<MeasureImpact[]>} A promise that resolves to an array of measure impacts.
 */
export async function getMultipleMeasureImpacts(measureImpactIds: number[]): Promise<MeasureImpact[]> {
    return await db.query.measureImpacts.findMany({ where: inArray(measureImpacts.id, measureImpactIds) });
}

/**
 * Gets a measure impact from a specified measure.
 *
 * @param {number} measureId - The id of the current project.
 * @returns {Promise<MeasureImpact | null>} A promise that resolves to the measure impact or null if not found.
 */
export async function getMeasureImpactByMeasure(measureId: number): Promise<MeasureImpact | null> {
    const measureImpact = await db.query.measureImpacts.findFirst({ where: eq(measureImpacts.measureId, measureId) });

    return measureImpact ?? null;
}

/**
 * Gets measure impacts from a specified threat.
 *
 * @param {number} threatId - The id of the current project.
 * @returns {Promise<MeasureImpact[]>} A promise that resolves to an array of measure impacts.
 */
export async function getMeasureImpactsByThreat(threatId: number): Promise<MeasureImpact[]> {
    return await db.query.measureImpacts.findMany({ where: eq(measureImpacts.threatId, threatId) });
}

/**
 * Creates a measure impact.
 *
 * @param {CreateMeasureImpact} createMeasureImpactData - Date of the measure impact.
 * @returns {Promise<MeasureImpact>} A promise that resolves to the created measure impact.
 * @throws {Error} If the measure impact could not be created.
 */
export async function createMeasureImpact(
    createMeasureImpactData: CreateMeasureImpact,
    transaction: TransactionType | undefined = undefined
): Promise<MeasureImpact> {
    let measureImpact: MeasureImpact | undefined;

    try {
        [measureImpact] = await (transaction ?? db).insert(measureImpacts).values(createMeasureImpactData).returning();
    } catch (error) {
        console.log(error);
    }

    if (!measureImpact) {
        throw new Error("Failed to create measure impact");
    }

    return measureImpact;
}

/**
 * Updates the measure impact with the specified id.
 *
 * @param {number} measureId - The id of the measure to update.
 * @param {UpdateMeasureImpact} updateMeasureImpactData - The data of the measure impact.
 * @returns {Promise<MeasureImpact>} A promise that resolves to the updated measure impact.
 * @throws {Error} If the measure impact could not be updated.
 */
export async function updateMeasureImpact(
    measureId: number,
    updateMeasureImpactData: UpdateMeasureImpact
): Promise<MeasureImpact> {
    const [measureImpact] = await db
        .update(measureImpacts)
        .set(updateMeasureImpactData)
        .where(eq(measureImpacts.id, measureId))
        .returning();

    if (!measureImpact) {
        throw new Error("Failed to update measure impact");
    }

    return measureImpact;
}

/**
 * Deletes a measure impact with the specified id.
 *
 * @param {number} measureImpactId - The id of the measure impact to delete.
 * @returns {Promise<void>} A promise that resolves when the measure impact is deleted.
 */
export async function deleteMeasureImpact(measureImpactId: number): Promise<void> {
    await db.delete(measureImpacts).where(eq(measureImpacts.id, measureImpactId));
}

/**
 * Delete all measure impacts that impacting a specified threat.
 *
 * @param {number} threatId - The id of the threat.
 * @returns {Promise<void>} A promise that resolves when the measure impacts are deleted.
 */
export async function deleteMeasureImpactsByThreat(threatId: number): Promise<void> {
    await db.delete(measureImpacts).where(eq(measureImpacts.threatId, threatId));
}
