/**
 * Module that defines the access and manipulation
 * of the catalogs.
 */
import { and, eq, getTableColumns } from "drizzle-orm";
import { createDefaultCatalogThreats, importCatalogThreats } from "#services/catalog-threats.service.js";
import { createDefaultCatalogMeasures, importCatalogMeasures } from "#services/catalog-measures.service.js";
import { db, TransactionType } from "#db/index.js";
import {
    Catalog,
    catalogs,
    CreateCatalog,
    CreateCatalogMeasure,
    CreateCatalogThreat,
    UpdateCatalog,
    usersCatalogs,
} from "#db/schema.js";
import { USER_ROLES } from "#types/user-roles.types.js";

/**
 * Defines type of catalog with the role of the user.
 */
export type CatalogWithRole = Catalog & {
    role: USER_ROLES;
};

/**
 * Gets all catalogs of the current user.
 *
 * @param {number} userId - The id of the user.
 * @returns {Promise<CatalogWithRole[]>} A promise that resolves to an array of catalogs with the user's role.
 */
export async function getCatalogsByUserId(userId: number): Promise<CatalogWithRole[]> {
    return await db
        .select({
            ...getTableColumns(catalogs),
            role: usersCatalogs.role,
        })
        .from(catalogs)
        .innerJoin(usersCatalogs, eq(catalogs.id, usersCatalogs.catalogId))
        .where(eq(usersCatalogs.userId, userId));
}

/**
 * Gets a catalog by its id and the user's id.
 *
 * @param {number} catalogId - The id of the catalog.
 * @param {number} userId - The id of the user.
 * @returns {Promise<CatalogWithRole | null>} A promise that resolves to the catalog with the user's role or null if not found.
 */
export async function getCatalog(catalogId: number, userId: number): Promise<CatalogWithRole | null> {
    const [catalog] = await db
        .select({
            ...getTableColumns(catalogs),
            role: usersCatalogs.role,
        })
        .from(catalogs)
        .innerJoin(usersCatalogs, eq(catalogs.id, usersCatalogs.catalogId))
        .where(and(eq(usersCatalogs.userId, userId), eq(catalogs.id, catalogId)));

    return catalog ?? null;
}

/**
 * Checks if a catalog exists in the database.
 *
 * @param catalogId - The id of the catalog to check.
 * @returns {Promise<boolean>} A promise that resolves to true if the catalog exists, false otherwise.
 */
export async function checkCatalogExists(catalogId: number): Promise<boolean> {
    return (await db.query.catalogs.findFirst({ where: eq(catalogs.id, catalogId) })) !== undefined;
}

/**
 * Creates a catalog and assigns the owner.
 *
 * @param {TransactionType} tx - The transaction object.
 * @param {CreateCatalog} createCatalogData - The data for the new catalog.
 * @param {number} userId - The id of the user who will be the owner.
 * @returns {Promise<Catalog>} A promise that resolves to the created catalog.
 */
async function createCatalogAndAssignOwner(
    tx: TransactionType,
    createCatalogData: CreateCatalog,
    userId: number
): Promise<Catalog> {
    const [catalog] = await tx.insert(catalogs).values(createCatalogData).returning();

    if (!catalog) {
        throw new Error("Failed to create catalog");
    }

    await tx.insert(usersCatalogs).values({
        userId: userId,
        catalogId: catalog.id,
        role: USER_ROLES.OWNER,
    });

    return catalog;
}

/**
 * Creates a default catalog inside the database including default threats and measures.
 *
 * @param {CreateCatalog} createCatalogData - The data of the catalog.
 * @param {number} userId - The id of the user who creates the catalog.
 * @returns {Promise<Catalog>} A promise that resolves to the created catalog.
 */
export async function createDefaultCatalog(createCatalogData: CreateCatalog, userId: number): Promise<Catalog> {
    return await db.transaction(async (tx) => {
        const catalog = await createCatalogAndAssignOwner(tx, createCatalogData, userId);

        // Creates default threats from the matrix.
        await createDefaultCatalogThreats(catalog.id, catalog.language, tx);

        // Creates default measures from the matrix.
        await createDefaultCatalogMeasures(catalog.id, catalog.language, tx);

        return catalog;
    });
}

export async function createEmptyCatalog(createCatalogData: CreateCatalog, userId: number): Promise<Catalog> {
    return await db.transaction(async (tx) => {
        const catalog = await createCatalogAndAssignOwner(tx, createCatalogData, userId);
        return catalog;
    });
}

/**
 * Creates a custom catalog including threats and measures.
 *
 * @param createCatalogData - The data of the catalog.
 * @param createCatalogThreatsData - The data of the catalog threats.
 * @param createCatalogMeasuresData - The data of the catalog measures.
 * @param userId - The id of the user who creates the catalog.
 * @param transaction - drizzle transaction.
 * @returns {Promise<Catalog>} A promise that resolves to the created catalog.
 */
export async function createCustomCatalog(
    createCatalogData: CreateCatalog,
    createCatalogThreatsData: CreateCatalogThreat[],
    createCatalogMeasuresData: CreateCatalogMeasure[],
    userId: number,
    transaction: TransactionType | undefined = undefined
): Promise<Catalog> {
    return await (transaction ?? db).transaction(async (tx) => {
        const catalog = await createCatalogAndAssignOwner(tx, createCatalogData, userId);

        await importCatalogThreats(
            createCatalogThreatsData.map((catalogThreat) => ({ ...catalogThreat, catalogId: catalog.id })),
            tx
        );

        await importCatalogMeasures(
            createCatalogMeasuresData.map((catalogThreat) => ({ ...catalogThreat, catalogId: catalog.id })),
            tx
        );

        return catalog;
    });
}

/**
 * Updates the catalog with the specified id.
 *
 * @param catalogId - The id of the catalog to update.
 * @param updateCatalogData - The catalog data.
 * @returns {Promise<Catalog>} A promise that resolves to the updated catalog.
 * @throws {Error} If the catalog could not be updated.
 */
export async function updateCatalog(catalogId: number, updateCatalogData: UpdateCatalog): Promise<Catalog> {
    const [catalog] = await db.update(catalogs).set(updateCatalogData).where(eq(catalogs.id, catalogId)).returning();

    if (!catalog) {
        throw new Error("Failed to update catalog");
    }

    return catalog;
}

/**
 * Deletes the catalog with the specified id.
 *
 * @param {number} catalogId - The id of the catalog.
 * @return {Promise<void>} A promise that resolves when the catalog is deleted.
 */
export async function deleteCatalog(catalogId: number): Promise<void> {
    await db.delete(catalogs).where(eq(catalogs.id, catalogId));
}
