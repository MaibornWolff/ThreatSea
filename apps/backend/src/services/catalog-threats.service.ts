/**
 * Module that defines the access and manipulation
 * of catalog threats.
 */
import { db, TransactionType } from "#db/index.js";
import { CatalogThreat, catalogThreats, CreateCatalogThreat, UpdateCatalogThreat } from "#db/schema.js";
import { eq } from "drizzle-orm";
import DefaultThreatMatrix from "../../templates/matrix/threats.matrix.json" with { type: "json" };
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";

interface Threat {
    text: Record<string, { name: string; description: string }>;
    probability: number;
}
type Attacker = Record<string, Threat>;
type PointsOfAttack = Record<string, Attacker>;

/**
 * Gets the default catalog threats from the default threat matrix.
 *
 * @param {number} catalogId - id of the catalog.
 * @param {string} language - The specified language.
 * @returns {CreateCatalogThreat[]} Array of catalog threats.
 */
function getDefaultCatalogThreats(catalogId: number, language = "DE"): CreateCatalogThreat[] {
    const catalogThreats: CreateCatalogThreat[] = [];
    const defaultThreats = DefaultThreatMatrix as PointsOfAttack;
    const pointsOfAttack = Object.keys(defaultThreats);

    for (const pointOfAttack of pointsOfAttack) {
        const attackers = Object.keys(defaultThreats[pointOfAttack]!);

        for (const attacker of attackers) {
            const { probability, text } = defaultThreats[pointOfAttack]![attacker]!;
            const { name, description } = text[language]!;
            catalogThreats.push({
                catalogId,
                name,
                description,
                pointOfAttack: Object.values(POINTS_OF_ATTACK).find((p) => p === pointOfAttack)!,
                attacker: Object.values(ATTACKERS).find((p) => p === attacker)!,
                probability,
                confidentiality: true,
                integrity: true,
                availability: true,
            });
        }
    }

    return catalogThreats;
}

/**
 * Gets all catalog threats of the specific catalog.
 *
 * @param {number} catalogId - The id of the catalog.
 * @returns {Promise<CatalogThreat[]>} Array of threats.
 */
export async function getCatalogThreatsByCatalogId(
    catalogId: number,
    transaction: TransactionType | undefined = undefined
): Promise<CatalogThreat[]> {
    return await (transaction ?? db).query.catalogThreats.findMany({ where: eq(catalogThreats.catalogId, catalogId) });
}

/**
 * Gets a specific catalog threat by its id.
 *
 * @param {number} catalogThreatId - The id of the catalog threat.
 * @returns {Promise<CatalogThreat | null>} A promise that resolves to the catalog threat or null if not found.
 */
export async function getCatalogThreatById(catalogThreatId: number): Promise<CatalogThreat | null> {
    const catalogThreat = await db.query.catalogThreats.findFirst({ where: eq(catalogThreats.id, catalogThreatId) });

    return catalogThreat ?? null;
}

/**
 * Creates a new catalog threat.
 *
 * @param {CreateCatalogThreat} createCatalogThreatData - Data of the catalog threat.
 * @returns {Promise<CatalogThreat>} A promise that resolves to the created catalog threat.
 * @throws {Error} If the catalog threat could not be created.
 */
export async function createCatalogThreat(createCatalogThreatData: CreateCatalogThreat): Promise<CatalogThreat> {
    const [catalogThreat] = await db.insert(catalogThreats).values(createCatalogThreatData).returning();

    if (!catalogThreat) {
        throw new Error("Failed to create catalog threat");
    }

    return catalogThreat;
}

/**
 * Imports multiple catalog threats.
 *
 * @param {CreateCatalogThreat[]} createCatalogThreatsData - The data of the catalog threats.
 * @param {TransactionType} transaction - drizzle transaction.
 * @returns {Promise<CatalogThreat[]>} A promise that resolves to the imported catalog threats.
 */
export async function importCatalogThreats(
    createCatalogThreatsData: CreateCatalogThreat[],
    transaction: TransactionType | undefined = undefined
): Promise<CatalogThreat[]> {
    return await (transaction ?? db).insert(catalogThreats).values(createCatalogThreatsData).returning();
}

/**
 * Updates the catalog threat with the specified id.
 *
 * @param {number} catalogThreatId - The id of the catalog threat to update.
 * @param {CatalogThreat} updateCatalogThreatData - The data of the catalog threat.
 * @returns {Promise<CatalogThreat>} A promise that resolves to the updated catalog threat.
 * @throws {Error} If the catalog threat could not be updated.
 */
export async function updateCatalogThreat(
    catalogThreatId: number,
    updateCatalogThreatData: UpdateCatalogThreat
): Promise<CatalogThreat> {
    const [catalogThreat] = await db
        .update(catalogThreats)
        .set(updateCatalogThreatData)
        .where(eq(catalogThreats.id, catalogThreatId))
        .returning();

    if (!catalogThreat) {
        throw new Error("Failed to update catalog threat");
    }

    return catalogThreat;
}

/**
 * Deletes the catalog threat with the specified id.
 *
 * @param {number} id - The id of the catalog threat.
 * @return {Promise<void>} A promise that resolves when the catalog threat is deleted.
 */

export async function deleteCatalogThreat(id: number) {
    await db.delete(catalogThreats).where(eq(catalogThreats.id, id));
}

/**
 * Creates the default catalog threats for a given catalog.
 *
 * @param {number} catalogId - The id of the catalog.
 * @param {string} language - The specified language.
 * @param {TransactionType} transaction - drizzle transaction.
 * @returns {Promise<CatalogThreat[]>} A promise that resolves to the created catalog threats.
 */
export async function createDefaultCatalogThreats(
    catalogId: number,
    language: string,
    transaction: TransactionType
): Promise<CatalogThreat[]> {
    const items = getDefaultCatalogThreats(catalogId, language);
    return await importCatalogThreats(items, transaction);
}
