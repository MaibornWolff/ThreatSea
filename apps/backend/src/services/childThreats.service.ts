/**
 * Module that defines the access and manipulation
 * of threats.
 */
import { and, eq } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { childThreats, ChildThreat, CreateChildThreat, UpdateChildThreat } from "#db/schema.js";
import { getGenericThreat } from "./genericThreats.service.js";
import { getCatalogThreatById } from "./catalog-threats.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { CHILD_THREAT_STATUSES } from "#types/child-threat-statuses.types.js";

// ------------------------------------------------------------------------------
// TODO: RENAMING TO THREAT INSTEAD OF CHILD THREAT LATER ON
// ------------------------------------------------------------------------------

/**
 * Gets all child threats of a generic threat.
 *
 * @param {number} genericThreatId - The id of the generic threat.
 * @returns {Promise<ChildThreat[]>} A promise that resolves to an array of child threats.
 */
export async function getChildThreatsByGenericThreatId(
    genericThreatId: number,
    transaction: TransactionType | undefined = undefined
): Promise<ChildThreat[]> {
    return await (transaction ?? db).query.childThreats.findMany({
        where: eq(childThreats.genericThreatId, genericThreatId),
    });
}

/**
 * Gets all child threats of a project.
 *
 * @param {number} projectId - The id of the project.
 * @returns {Promise<ChildThreat[]>} A promise that resolves to an array of child threats.
 */
export async function getChildThreatsByProjectId(
    projectId: number,
    transaction: TransactionType | undefined = undefined
): Promise<ChildThreat[]> {
    return await (transaction ?? db).query.childThreats.findMany({
        where: eq(childThreats.projectId, projectId),
    });
}

/**
 * Gets a specific child threat by its id.
 *
 * @param {number} threatId - The id of the threat.
 * @returns {Promise<ChildThreat | null>} A promise that resolves to the child threat or null if not found.
 */
export async function getChildThreat(childThreatId: number): Promise<ChildThreat | null> {
    const threat = await db.query.childThreats.findFirst({ where: eq(childThreats.id, childThreatId) });

    return threat ?? null;
}

/**
 * Creates a child threat.
 *
 * @param {CreateChildThreat} createChildThreatData - The data of the child threat.
 * @param {TransactionType} transaction - drizzle transaction.
 * @returns {Promise<ChildThreat>} A promise that resolves to the created child threat.
 * @throws {Error} If the child threat could not be created.
 */
export async function createChildThreat(
    createChildThreatData: CreateChildThreat,
    transaction: TransactionType | undefined = undefined
): Promise<ChildThreat> {
    const [childthreat] = await (transaction ?? db).insert(childThreats).values(createChildThreatData).returning();

    if (!childthreat) {
        throw new Error("Failed to create child threat");
    }

    return childthreat;
}

export async function createThreatForGenericThreat(
    genericThreatId: number,
    transaction: TransactionType | undefined = undefined
): Promise<ChildThreat> {
    const genericThreat = await getGenericThreat(genericThreatId, transaction);

    if (!genericThreat) {
        throw new NotFoundError("Generic threat not found");
    }

    const catalogThreat = await getCatalogThreatById(genericThreat.catalogThreatId, transaction);

    if (!catalogThreat) {
        throw new NotFoundError("Catalog threat not found");
    }

    const createThreatData: CreateChildThreat = {
        attacker: genericThreat.attacker,
        name: genericThreat.name,
        description: genericThreat.description,
        confidentiality: catalogThreat?.confidentiality,
        integrity: catalogThreat.integrity,
        availability: catalogThreat.availability,
        projectId: genericThreat.projectId,
        pointOfAttack: genericThreat.pointOfAttack,
        probability: catalogThreat.probability,
        pointOfAttackId: genericThreat.pointOfAttackId,
        status: CHILD_THREAT_STATUSES.NEW,
        genericThreatId: genericThreatId,
    };

    return await createChildThreat(createThreatData, transaction);
}

/**
 * Updates the child threat with the specified id.
 *
 * @param {number} childThreatId - The id of the child threat.
 * @param {UpdateChildThreat} updateChildThreatData - The data of the child threat.
 * @returns {Promise<ChildThreat>} A promise that resolves to the updated child threat.
 * @throws {Error} If the child threat could not be updated.
 */
export async function updateChildThreat(
    childThreatId: number,
    updateChildThreatData: UpdateChildThreat
): Promise<ChildThreat> {
    const [childthreat] = await db
        .update(childThreats)
        .set(updateChildThreatData)
        .where(eq(childThreats.id, childThreatId))
        .returning();

    if (!childthreat) {
        throw new Error("Failed to update child threat");
    }

    return childthreat;
}

/**
 * Deletes the child threat with the specified id.
 *
 * @param {number} childThreatId - The id of the child threat.
 * @returns {Promise<void>} A promise that resolves when the child threat is deleted.
 */
export async function deleteChildThreat(childThreatId: number): Promise<void> {
    await db.delete(childThreats).where(eq(childThreats.id, childThreatId));
}

export async function deleteChildThreatsByPointOfAttackId(
    pointOfAttackId: string,
    projectId: number,
    transaction: TransactionType | undefined = undefined
): Promise<void> {
    const whereCondition =
        projectId === undefined
            ? eq(childThreats.pointOfAttackId, pointOfAttackId)
            : and(eq(childThreats.pointOfAttackId, pointOfAttackId), eq(childThreats.projectId, projectId));

    await (transaction ?? db).delete(childThreats).where(whereCondition);
}
