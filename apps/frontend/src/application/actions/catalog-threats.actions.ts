/**
 * @module catalog-threats.actions - Defines the actions for the
 *     catalogue threats.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { CatalogThreatsApi } from "#api/catalog-threats.api.ts";
import type {
    CatalogThreat,
    CreateCatalogThreatRequest,
    UpdateCatalogThreatRequest,
} from "#api/types/catalog-threat.types.ts";

/**
 * Wrapper class to export the action functions
 * for the catalogues threat actions.
 */
export class CatalogThreatsActions {
    /**
     * Action that gets the catalogue threats using the backend api.
     * @function getCatalogThreats
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the catalogue threats.
     * @returns Action function for getting the catalogue threats.
     */
    static getCatalogThreats = createAsyncThunk(
        "[catalog threats] get catalog threats",
        async (data: { catalogId: number }) => {
            return await CatalogThreatsApi.getCatalogThreats(data);
        }
    );

    /**
     * Action that creates a catalogue threat using the backend api.
     * @function createCatalogThreat
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create a catalogue threat.
     * @returns Action function for creating a catalogue threat.
     */
    static createCatalogThreat = createAsyncThunk(
        "[catalog threats] create catalog threat",
        async (data: CreateCatalogThreatRequest) => {
            return await CatalogThreatsApi.createCatalogThreat(data);
        }
    );

    /**
     * Action that imports catalogue threats using the backend api.
     * @function importCatalogThreats
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to import catalogue threats.
     * @returns Action function for importing catalogue threats.
     */
    static importCatalogThreats = createAsyncThunk(
        "[catalog threats] import catalog threats",
        async (data: { catalogId: number; catalogThreats: CreateCatalogThreatRequest[] }) => {
            return await CatalogThreatsApi.importCatalogThreats(data);
        }
    );

    /**
     * Action that updates a catalogue threat using the backend api.
     * @function updateCatalogThreat
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update a catalogue threat.
     * @returns Action function for updating a catalogue threat.
     */
    static updateCatalogThreat = createAsyncThunk(
        "[catalog threats] update catalog threat",
        async (data: UpdateCatalogThreatRequest) => {
            return await CatalogThreatsApi.updateCatalogThreat(data);
        }
    );

    /**
     * Action that deletes a catalogue threat using the backend api.
     * @function deleteCatalogThreat
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to delete a catalogue threat.
     * @returns Action function for deleting a catalogue threat.
     */
    static deleteCatalogThreat = createAsyncThunk(
        "[catalog threats] delete catalog threat",
        async (data: CatalogThreat) => {
            await CatalogThreatsApi.deleteCatalogThreat(data);
            return data;
        }
    );

    /**
     * Action that changes catalogue threats.
     * @function setCatalogThreat
     * @param {string} type - Action type.
     * @returns Action function for changing catalogue threats.
     */
    static setCatalogThreat = createAction<CatalogThreat>("[catalog threats] set catalog threat");

    /**
     * Action that removes catalogue.
     * @function removeCatalogThreat
     * @param {string} type - Action type.
     * @returns Action function for removing catalogue threats.
     */
    static removeCatalogThreat = createAction<CatalogThreat>("[catalog threats] remove catalog threat");
}
