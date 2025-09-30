/**
 * @module catalog-threats.api - Defines the api calls
 *     for the catalogue threats.
 */
import type {
    CatalogThreat,
    CreateCatalogThreatRequest,
    UpdateCatalogThreatRequest,
} from "#api/types/catalog-threat.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines the api functions
 * for the catalogue threats.
 */
export class CatalogThreatsApi {
    /**
     * Gets all catalogue threats of the specified catalogue
     * from the backend.
     * @param {number} catalogId - id of the catalogue.
     * @returns All catalogue threats.
     */
    static async getCatalogThreats({ catalogId }: { catalogId: number }): Promise<CatalogThreat[]> {
        return await fetchAPI(`/catalogs/${catalogId}/threats`);
    }

    /**
     * Creates a catalogue threat in the backend.
     * @param {CreateCatalogThreatRequest} data - Data of the catalogue threat.
     * @returns The created threat.
     */
    static async createCatalogThreat(data: CreateCatalogThreatRequest): Promise<CatalogThreat> {
        const { catalogId, ...body } = data;

        return await fetchAPI(`/catalogs/${catalogId}/threats`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Saves the imported catalogue threats inside the backend.
     *
     * @param {number} catalogId - id of the catalogue.
     * @param {CreateCatalogThreatRequest[]} catalogThreats - Catalogue threats that are imported.
     * @returns The imported catalogue threats.
     */
    static async importCatalogThreats({
        catalogId,
        catalogThreats,
    }: {
        catalogId: number;
        catalogThreats: CreateCatalogThreatRequest[];
    }): Promise<CatalogThreat[]> {
        return await fetchAPI(`/catalogs/${catalogId}/threats/import`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(catalogThreats),
        });
    }

    /**
     * Updates a catalogue threat inside the backend.
     * @param {UpdateCatalogThreatRequest} data - Data of the catalogues threat.
     * @returns The updated threat.
     */
    static async updateCatalogThreat(data: UpdateCatalogThreatRequest): Promise<CatalogThreat> {
        const { catalogId, id, ...body } = data;

        return await fetchAPI(`/catalogs/${catalogId}/threats/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a catalogue threat in the backend.
     * @param {CatalogThreat} data - Data of the threat.
     */
    static async deleteCatalogThreat(data: CatalogThreat) {
        await fetchAPI<void>(`/catalogs/${data.catalogId}/threats/${data.id}`, {
            method: "DELETE",
        });
    }
}
