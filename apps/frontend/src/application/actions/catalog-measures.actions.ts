/**
 * @module use-catalog-measures.actions - Defines
 *     the actions for the catalogue measures.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { CatalogMeasuresApi } from "#api/catalog-measures.api.ts";
import type {
    CatalogMeasure,
    CreateCatalogMeasureRequest,
    UpdateCatalogMeasureRequest,
} from "#api/types/catalog-measure.types.ts";

/**
 * Exports the actions for the catalogue measures
 * with a wrapper class.
 */
export class CatalogMeasuresActions {
    /**
     * Get the catalogue measures from the server.
     * @function getCatalogMeasures
     * @returns Action to retrieve the measures from the server.
     */
    static getCatalogMeasures = createAsyncThunk(
        "[catalog measures] get catalog measures",
        async (data: { catalogId: number }) => {
            return await CatalogMeasuresApi.getCatalogMeasures(data);
        }
    );

    /**
     * Creates a measure with the specified data.
     * @function createCatalogMeasure
     * @returns Action to create a measure for the catalogue.
     */
    static createCatalogMeasure = createAsyncThunk(
        "[catalog measures] create catalog measure",
        async (data: CreateCatalogMeasureRequest) => {
            return await CatalogMeasuresApi.createCatalogMeasure(data);
        }
    );

    /**
     * Imports the catalogue measures.
     * @function importCatalogMeasures
     * @returns Action to import measures from a csv file
     */
    static importCatalogMeasures = createAsyncThunk(
        "[catalog measures] import catalog measures",
        async (data: { catalogId: number; catalogMeasures: CreateCatalogMeasureRequest[] }) => {
            return await CatalogMeasuresApi.importCatalogMeasures(data);
        }
    );

    /**
     * Updates a catalogues measure.
     * @function updateCatalogMeasure
     * @returns Action to update a catalogues measure.
     */
    static updateCatalogMeasure = createAsyncThunk(
        "[catalog measures] update catalog measure",
        async (data: UpdateCatalogMeasureRequest) => {
            return await CatalogMeasuresApi.updateCatalogMeasure(data);
        }
    );

    /**
     * Deletes a catalogues measure.
     * @function deleteCatalogMeasure
     * @returns Action to delete a catalogues measure.
     */
    static deleteCatalogMeasure = createAsyncThunk(
        "[catalog measures] delete catalog measure",
        async (data: CatalogMeasure) => {
            await CatalogMeasuresApi.deleteCatalogMeasure(data);
            return data;
        }
    );

    /**
     * Changes catalogue measures.
     * @function setCatalogMeasure
     * @returns Action to change a measure from the catalogue.
     */
    static setCatalogMeasure = createAction("[catalog measures] set catalog measure");

    /**
     * Removes measures from the catalogue.
     * @function removeCatalogMeasure
     * @returns Action to remove a measure from the catalogue.
     */
    static removeCatalogMeasure = createAction("[catalog measures] remove catalog measure");
}
