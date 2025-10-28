/**
 * @module catalogs.api - Defines the api calls
 *     for the catalogues
 */
import type {
    Catalog,
    CatalogWithRole,
    CreateCatalogRequest,
    UpdateCatalogRequest,
} from "#api/types/catalogs.types.ts";
import { fetchAPI } from "#api/utils.ts";

/**
 * Wrapper class that defines the api function of the
 * catalogues.
 */
export class CatalogsAPI {
    /**
     * Fetches all catalogues.
     * @returns Array of catalogue objects.
     */
    static async getCatalogs(): Promise<CatalogWithRole[]> {
        return await fetchAPI("/catalogs");
    }

    /**
     * Fetches a specific catalogue from the backend.
     * @returns Data of the catalogue as an object.
     */
    static async getCatalog(catalogId: number): Promise<CatalogWithRole> {
        return await fetchAPI(`/catalogs/${catalogId}`);
    }

    /**
     * Creates a catalogue inside the backend.
     * @param {CreateCatalogRequest} data - Data of the catalogue.
     * @returns The created catalogue.
     */
    static async createCatalog(data: CreateCatalogRequest): Promise<Catalog> {
        return await fetchAPI("/catalogs", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
    }

    /**
     * Updates a catalogue inside the backend.
     * @param {UpdateCatalogRequest} data - Data of the catalogue.
     * @returns The updated catalogue.
     */
    static async updateCatalog(data: UpdateCatalogRequest): Promise<Catalog> {
        const { id, ...body } = data;
        return await fetchAPI(`/catalogs/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
    }

    /**
     * Deletes a catalogue in the backend.
     * @param {Catalog} data - Data of the catalogue.
     */
    static async deleteCatalog(data: Catalog) {
        await fetchAPI<void>(`/catalogs/${data.id}`, {
            method: "DELETE",
        });
    }
}
