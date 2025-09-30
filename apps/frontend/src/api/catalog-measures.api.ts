/**
 * @module catalog-measures.api - Defines the api calls
 *     for the catalogue measures.
 */
import type {
    CatalogMeasure,
    CreateCatalogMeasureRequest,
    UpdateCatalogMeasureRequest,
} from "#api/types/catalog-measure.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines static function for the
 * catalogues measures api calls.
 */
export class CatalogMeasuresApi {
    /**
     * Fetches all measures from the specified catalogue.
     * @param {number} catalogId - id of the catalogue.
     * @returns Array of all catalogue measures.
     */
    static async getCatalogMeasures({ catalogId }: { catalogId: number }): Promise<CatalogMeasure[]> {
        return await fetchAPI(`/catalogs/${catalogId}/measures`);
    }

    /**
     * Creates a new catalogue measure inside the backend.
     * @param {CreateCatalogMeasureRequest} data - Data of the measure.
     * @returns The catalogues measure object.
     */
    static async createCatalogMeasure(data: CreateCatalogMeasureRequest): Promise<CatalogMeasure> {
        const { catalogId, ...body } = data;

        return await fetchAPI(`/catalogs/${catalogId}/measures`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Saves all imported catalogue measures inside the backend.
     * @param {number} catalogId - id of the catalogue.
     * @param {CreateCatalogMeasureRequest[]} catalogMeasures - The catalogue measures to save.
     * @returns The imported measures.
     */
    static async importCatalogMeasures({
        catalogId,
        catalogMeasures,
    }: {
        catalogId: number;
        catalogMeasures: CreateCatalogMeasureRequest[];
    }): Promise<CatalogMeasure[]> {
        return await fetchAPI(`/catalogs/${catalogId}/measures/import`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(catalogMeasures),
        });
    }

    /**
     * Updates a catalogue measure inside the backend.
     * @param {UpdateCatalogMeasureRequest} data - Data of the catalogue measure.
     * @returns The updated catalogue measure.
     */
    static async updateCatalogMeasure(data: UpdateCatalogMeasureRequest): Promise<CatalogMeasure> {
        const { id, catalogId, ...body } = data;

        return await fetchAPI(`/catalogs/${catalogId}/measures/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a catalogue measure in the backend.
     * @param {CatalogMeasure} data - Data of the catalogue measure.
     */
    static async deleteCatalogMeasure(data: CatalogMeasure) {
        await fetchAPI<void>(`/catalogs/${data.catalogId}/measures/${data.id}`, {
            method: "DELETE",
        });
    }
}
