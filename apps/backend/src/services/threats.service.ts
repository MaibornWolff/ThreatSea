/**
 * Module that defines the access and manipulation
 * of threats.
 */
import { and, eq } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { threats, Threat, CreateThreat, UpdateThreat } from "#db/schema.js";
import { getGenericThreat } from "./generic-threats.service.js";
import { getCatalogThreatById } from "./catalog-threats.service.js";
import { NotFoundError } from "#errors/not-found.error.js";
import { THREAT_STATUSES } from "#types/threat-statuses.types.js";

// ------------------------------------------------------------------------------
// TODO: RENAMING TO THREAT INSTEAD OF CHILD THREAT LATER ON
// ------------------------------------------------------------------------------

/**
 * Gets all child threats of a generic threat.
 *
 * @param {number} genericThreatId - The id of the generic threat.
 * @returns {Promise<Threat[]>} A promise that resolves to an array of child threats.
 */
export async function getThreatsByGenericThreatId(
    genericThreatId: number,
    transaction: TransactionType | undefined = undefined
): Promise<Threat[]> {
    return await (transaction ?? db).query.threats.findMany({
        where: eq(threats.genericThreatId, genericThreatId),
    });
}

/**
 * Gets all child threats of a project.
 *
 * @param {number} projectId - The id of the project.
 * @returns {Promise<Threat[]>} A promise that resolves to an array of child threats.
 */
export async function getThreatsByProjectId(
    projectId: number,
    transaction: TransactionType | undefined = undefined
): Promise<Threat[]> {
    return await (transaction ?? db).query.threats.findMany({
        where: eq(threats.projectId, projectId),
    });
}

/**
 * Gets a specific child threat by its id.
 *
 * @param {number} threatId - The id of the threat.
 * @returns {Promise<Threat | null>} A promise that resolves to the child threat or null if not found.
 */
export async function getThreat(threatId: number): Promise<Threat | null> {
    const threat = await db.query.threats.findFirst({ where: eq(threats.id, threatId) });

    return threat ?? null;
}

/**
 * Creates a child threat.
 *
 * @param {CreateThreat} createThreatData - The data of the child threat.
 * @param {TransactionType} transaction - drizzle transaction.
 * @returns {Promise<Threat>} A promise that resolves to the created child threat.
 * @throws {Error} If the child threat could not be created.
 */
export async function createThreat(
    createThreatData: CreateThreat,
    transaction: TransactionType | undefined = undefined
): Promise<Threat> {
    const [childthreat] = await (transaction ?? db).insert(threats).values(createThreatData).returning();

    if (!childthreat) {
        throw new Error("Failed to create child threat");
    }

    return childthreat;
}

/** The user-editable subset of a child threat; identity fields are excluded on purpose. */
export type ThreatRefinement = Partial<
    Pick<
        CreateThreat,
        "name" | "description" | "probability" | "confidentiality" | "integrity" | "availability" | "status"
    >
>;

export async function createThreatForGenericThreat(
    genericThreatId: number,
    refinement: ThreatRefinement = {},
    transaction: TransactionType | undefined = undefined
): Promise<Threat> {
    const genericThreat = await getGenericThreat(genericThreatId, transaction);

    if (!genericThreat) {
        throw new NotFoundError("Generic threat not found");
    }

    const catalogThreat = await getCatalogThreatById(genericThreat.catalogThreatId, transaction);

    if (!catalogThreat) {
        throw new NotFoundError("Catalog threat not found");
    }

    const createThreatData: CreateThreat = {
        attacker: genericThreat.attacker,
        name: refinement.name ?? genericThreat.name,
        description: refinement.description ?? "",
        confidentiality: refinement.confidentiality ?? catalogThreat.confidentiality,
        integrity: refinement.integrity ?? catalogThreat.integrity,
        availability: refinement.availability ?? catalogThreat.availability,
        projectId: genericThreat.projectId,
        pointOfAttack: genericThreat.pointOfAttack,
        probability: refinement.probability ?? catalogThreat.probability,
        pointOfAttackId: genericThreat.pointOfAttackId,
        status: refinement.status ?? THREAT_STATUSES.NEW,
        genericThreatId: genericThreatId,
    };

    return await createThreat(createThreatData, transaction);
}

/**
 * Updates the child threat with the specified id.
 *
 * @param {number} threatId - The id of the child threat.
 * @param {UpdateThreat} updateThreatData - The data of the child threat.
 * @returns {Promise<Threat>} A promise that resolves to the updated child threat.
 * @throws {Error} If the child threat could not be updated.
 */
export async function updateThreat(threatId: number, updateThreatData: UpdateThreat): Promise<Threat> {
    const [childthreat] = await db.update(threats).set(updateThreatData).where(eq(threats.id, threatId)).returning();

    if (!childthreat) {
        throw new Error("Failed to update child threat");
    }

    return childthreat;
}

/**
 * Deletes the child threat with the specified id.
 *
 * @param {number} threatId - The id of the child threat.
 * @returns {Promise<void>} A promise that resolves when the child threat is deleted.
 */
export async function deleteThreat(threatId: number): Promise<void> {
    await db.delete(threats).where(eq(threats.id, threatId));
}

export async function deleteThreatsByPointOfAttackId(
    pointOfAttackId: string,
    projectId: number,
    transaction: TransactionType | undefined = undefined
): Promise<void> {
    await (transaction ?? db)
        .delete(threats)
        .where(and(eq(threats.pointOfAttackId, pointOfAttackId), eq(threats.projectId, projectId)));
}
