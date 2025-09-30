/**
 * Module that defines access and manipulation for
 * the catalog measures.
 */
import { eq } from "drizzle-orm";
import { db, TransactionType } from "#db/index.js";
import { CatalogMeasure, catalogMeasures, CreateCatalogMeasure, UpdateCatalogMeasure } from "#db/schema.js";
import DefaultMeasuresMatrix from "../../templates/matrix/measures.matrix.json" with { type: "json" };
import { POINTS_OF_ATTACK } from "#types/points-of-attack.types.js";
import { ATTACKERS } from "#types/attackers.types.js";

interface Measure {
    text: Record<string, { name: string }>;
}
type Attacker = Record<string, Measure[]>;
type SecurityMeasures = Record<string, Attacker>;

/**
 * Gets the default catalog measures from the default measure matrix.
 *
 * @param {number} catalogId - The id of the catalog.
 * @param {string} language - The specified language.
 * @returns {CreateCatalogMeasure[]} A promise that resolves to an array of creatable catalog measures objects.
 */
function getDefaultCatalogMeasures(catalogId: number, language = "EN"): CreateCatalogMeasure[] {
    const catalogMeasures: CreateCatalogMeasure[] = [];
    const defaultMeasures = DefaultMeasuresMatrix as SecurityMeasures;
    const pointOfAttacks = Object.keys(defaultMeasures);

    for (const pointOfAttack of pointOfAttacks) {
        const attackers = Object.keys(defaultMeasures[pointOfAttack]!);

        for (const attacker of attackers) {
            for (const measure of defaultMeasures[pointOfAttack]![attacker]!) {
                const { name } = measure.text[language]!;
                catalogMeasures.push({
                    catalogId,
                    name,
                    description: "",
                    pointOfAttack: Object.values(POINTS_OF_ATTACK).find((p) => p === pointOfAttack) as POINTS_OF_ATTACK,
                    attacker: Object.values(ATTACKERS).find((p) => p === attacker) as ATTACKERS,
                    probability: null,
                    confidentiality: true,
                    integrity: true,
                    availability: true,
                });
            }
        }
    }
    return catalogMeasures;
}

/**
 * Gets all catalog measures of the specified catalog.
 *
 * @param {number} catalogId - The id of the catalog.
 * @returns {CatalogMeasure[]} A promise that resolves to an array of catalog measures.
 */
export async function getCatalogMeasuresByCatalogId(
    catalogId: number,
    transaction: TransactionType | undefined = undefined
): Promise<CatalogMeasure[]> {
    return await (transaction ?? db).query.catalogMeasures.findMany({
        where: eq(catalogMeasures.catalogId, catalogId),
    });
}

/**
 * Gets a specific catalog measure by its id.
 *
 * @param {number} catalogMeasureId - The id of the catalog-measure
 * @returns {Promise<CatalogMeasure | null>} A promise that resolves to the catalog measure or null if not found.
 */
export async function getCatalogMeasureById(catalogMeasureId: number): Promise<CatalogMeasure | null> {
    const catalogMeasure = await db.query.catalogMeasures.findFirst({
        where: eq(catalogMeasures.id, catalogMeasureId),
    });

    return catalogMeasure ?? null;
}

/**
 * Creates a new catalog measure.
 *
 * @param {CreateCatalogMeasure} createCatalogMeasureData - The data of the catalog measure to be created.
 * @returns {Promise<CatalogMeasure>} A promise that resolves to the created catalog measure.
 * @throws {Error} If the catalog measure could not be created.
 */
export async function createCatalogMeasure(createCatalogMeasureData: CreateCatalogMeasure): Promise<CatalogMeasure> {
    const [catalogMeasure] = await db.insert(catalogMeasures).values(createCatalogMeasureData).returning();

    if (!catalogMeasure) {
        throw new Error("Failed to create catalog measure");
    }

    return catalogMeasure;
}

/**
 * Imports multiple catalog measures.
 *
 * @param {CreateCatalogMeasure} createCatalogMeasuresData - The data of the catalog measures.
 * @param {TransactionType} transaction - drizzle transaction
 * @returns {Promise<CatalogMeasure[]>} A promise that resolves to the imported catalog measures.
 */
export async function importCatalogMeasures(
    createCatalogMeasuresData: CreateCatalogMeasure[],
    transaction: TransactionType | undefined = undefined
): Promise<CatalogMeasure[]> {
    return await (transaction ?? db).insert(catalogMeasures).values(createCatalogMeasuresData).returning();
}

/**
 * Updates the catalog measure with the specified id.
 *
 * @param {number} catalogId - The id of the catalog.
 * @param {number} catalogMeasureId - The id of the catalog measure to update.
 * @param {UpdateCatalogMeasure} updateCatalogMeasureData - The data to update the catalog measure with.
 * @returns {Promise<CatalogMeasure>} A promise that resolves to the updated catalog measure.
 * @throws {Error} If the catalog measure could not be updated.
 */
export async function updateCatalogMeasure(
    catalogMeasureId: number,
    updateCatalogMeasureData: UpdateCatalogMeasure
): Promise<CatalogMeasure> {
    const [catalogMeasure] = await db
        .update(catalogMeasures)
        .set(updateCatalogMeasureData)
        .where(eq(catalogMeasures.id, catalogMeasureId))
        .returning();

    if (!catalogMeasure) {
        throw new Error("Failed to update catalog measure");
    }

    return catalogMeasure;
}

/**
 * Deletes the catalog measure with the specified id.
 *
 * @param {number} catalogMeasureId - The id of the catalog measure.
 * @return {Promise<void>} A promise that resolves when the catalog measure is deleted.
 */
export async function deleteCatalogMeasure(catalogMeasureId: number) {
    await db.delete(catalogMeasures).where(eq(catalogMeasures.id, catalogMeasureId));
}

/**
 * Creates the default catalog measures for a given catalog.
 *
 * @param {number} catalogId - The id of the catalog.
 * @param {string} language - The specified language.
 * @param {TransactionType} transaction - drizzle transaction.
 * @returns {Promise<CatalogMeasure[]>} A promise that resolves to the created catalog threats.
 */
export async function createDefaultCatalogMeasures(
    catalogId: number,
    language: string,
    transaction: TransactionType
): Promise<CatalogMeasure[]> {
    const items = getDefaultCatalogMeasures(catalogId, language);
    return await importCatalogMeasures(items, transaction);
}
