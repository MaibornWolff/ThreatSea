/**
 * Module that defines the access and manipulation
 * for child-threat-linked measure impacts.
 */
import { eq, getTableColumns, inArray } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import {
    childThreatMeasureImpacts,
    ChildThreatMeasureImpact,
    CreateChildThreatMeasureImpact,
    measures,
    UpdateChildThreatMeasureImpact,
} from "#db/schema.js";

/**
 * Gets all child-threat measure impacts of the specified project.
 *
 * @param {number} projectId - The id of the current project.
 * @returns {Promise<ChildThreatMeasureImpact[]>} A promise that resolves to an array of child-threat measure impacts.
 */
export async function getChildThreatMeasureImpactsByProject(projectId: number): Promise<ChildThreatMeasureImpact[]> {
    return await db
        .select({ ...getTableColumns(childThreatMeasureImpacts) })
        .from(measures)
        .innerJoin(childThreatMeasureImpacts, eq(measures.id, childThreatMeasureImpacts.measureId))
        .where(eq(measures.projectId, projectId));
}

/**
 * Gets all child-threat measure impacts for a specified child threat.
 *
 * @param {number} childThreatId - The id of the child threat.
 * @returns {Promise<ChildThreatMeasureImpact[]>} A promise that resolves to an array of child-threat measure impacts.
 */
export async function getChildThreatMeasureImpactsByChildThreat(
    childThreatId: number
): Promise<ChildThreatMeasureImpact[]> {
    return await db.query.childThreatMeasureImpacts.findMany({
        where: eq(childThreatMeasureImpacts.childThreatId, childThreatId),
    });
}

/**
 * Gets a specific child-threat measure impact by its id.
 *
 * @param {number} measureImpactId - The id of the child-threat measure impact.
 * @returns {Promise<ChildThreatMeasureImpact | null>} The child-threat measure impact or null if not found.
 */
export async function getChildThreatMeasureImpact(measureImpactId: number): Promise<ChildThreatMeasureImpact | null> {
    const measureImpact = await db.query.childThreatMeasureImpacts.findFirst({
        where: eq(childThreatMeasureImpacts.id, measureImpactId),
    });

    return measureImpact ?? null;
}

/**
 * Gets multiple child-threat measure impacts by their ids.
 *
 * @param {number[]} measureImpactIds - The ids of the child-threat measure impacts.
 * @returns {Promise<ChildThreatMeasureImpact[]>} A promise that resolves to an array of child-threat measure impacts.
 */
export async function getMultipleChildThreatMeasureImpacts(
    measureImpactIds: number[]
): Promise<ChildThreatMeasureImpact[]> {
    return await db.query.childThreatMeasureImpacts.findMany({
        where: inArray(childThreatMeasureImpacts.id, measureImpactIds),
    });
}

/**
 * Creates a child-threat measure impact.
 *
 * @param {CreateChildThreatMeasureImpact} createMeasureImpactData - Data of the child-threat measure impact.
 * @returns {Promise<ChildThreatMeasureImpact>} The created child-threat measure impact.
 * @throws {Error} If the child-threat measure impact could not be created.
 */
export async function createChildThreatMeasureImpact(
    createMeasureImpactData: CreateChildThreatMeasureImpact,
    transaction: TransactionType | undefined = undefined
): Promise<ChildThreatMeasureImpact> {
    let measureImpact: ChildThreatMeasureImpact | undefined;

    [measureImpact] = await (transaction ?? db)
        .insert(childThreatMeasureImpacts)
        .values(createMeasureImpactData)
        .returning();
    
    if (!measureImpact) {
        throw new Error("Failed to create child-threat measure impact");
    }

    return measureImpact;
}

/**
 * Updates a specific child-threat measure impact.
 *
 * @param {number} measureImpactId - The id of the child-threat measure impact.
 * @param {UpdateChildThreatMeasureImpact} updateMeasureImpactData - The data to update.
 * @returns {Promise<ChildThreatMeasureImpact>} The updated child-threat measure impact.
 * @throws {Error} If the child-threat measure impact could not be updated.
 */
export async function updateChildThreatMeasureImpact(
    measureImpactId: number,
    updateMeasureImpactData: UpdateChildThreatMeasureImpact
): Promise<ChildThreatMeasureImpact> {
    const [measureImpact] = await db
        .update(childThreatMeasureImpacts)
        .set(updateMeasureImpactData)
        .where(eq(childThreatMeasureImpacts.id, measureImpactId))
        .returning();

    if (!measureImpact) {
        throw new Error("Failed to update child-threat measure impact");
    }

    return measureImpact;
}

/**
 * Deletes a child-threat measure impact with the specified id.
 *
 * @param {number} measureImpactId - The id of the child-threat measure impact to delete.
 * @returns {Promise<void>} A promise that resolves when the child-threat measure impact is deleted.
 */
export async function deleteChildThreatMeasureImpact(measureImpactId: number): Promise<void> {
    await db.delete(childThreatMeasureImpacts).where(eq(childThreatMeasureImpacts.id, measureImpactId));
}

/**
 * Delete all child-threat measure impacts that impact a specified child threat.
 *
 * @param {number} childThreatId - The id of the child threat.
 * @returns {Promise<void>} A promise that resolves when the child-threat measure impacts are deleted.
 */
export async function deleteChildThreatMeasureImpactsByChildThreat(childThreatId: number): Promise<void> {
    await db.delete(childThreatMeasureImpacts).where(eq(childThreatMeasureImpacts.childThreatId, childThreatId));
}
