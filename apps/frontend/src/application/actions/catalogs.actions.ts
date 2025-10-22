/**
 * @module catalog.actions - Defines the actions for the
 *     catalogue.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { CatalogsAPI } from "#api/catalogs.api.ts";
import type {
    Catalog,
    CatalogWithRole,
    CreateCatalogRequest,
    UpdateCatalogRequest,
} from "#api/types/catalogs.types.ts";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";

/**
 * Wrapper class that defines functions
 * for the actions of the catalogues.
 */
export class CatalogsActions {
    /**
     * Action that gets the catalogues using the backend api.
     * @function getCatalogs
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the catalogues.
     * @returns Action function for getting the catalogues.
     */
    static getCatalogs = createAsyncThunk("[catalogs] get catalogs", async () => {
        return await CatalogsAPI.getCatalogs();
    });

    /**
     * Action that fetches the data of a single catalogue from with the backend api.
     * @function getCatalogFromBackend
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch a catalogue.
     * @returns Action function for getting a single catalogue.
     */
    static getCatalogFromBackend = createAsyncThunk(
        "[catalog] get single catalog from backend",
        async (catalogId: number) => {
            return await CatalogsAPI.getCatalog(catalogId);
        }
    );

    /**
     * Action that creates a catalogue using the backend api.
     * @function createCatalog
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create a catalogue.
     * @returns Action function for creating a catalogue.
     */
    static createCatalog = createAsyncThunk("[catalogs] create catalog", async (data: CreateCatalogRequest) => {
        return await CatalogsAPI.createCatalog(data);
    });

    /**
     * Action that updates a catalogue using the backend api.
     * @function updateCatalog
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update a catalogue.
     * @returns Action function for updating a catalogue.
     */
    static updateCatalog = createAsyncThunk("[catalogs] update catalog", async (data: UpdateCatalogRequest) => {
        return await CatalogsAPI.updateCatalog(data);
    });

    /**
     * Action that deletes a catalogue using the backend api.
     * @function deleteCatalog
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to delete a catalogue.
     * @returns Action function for deleting a catalogue.
     */
    static deleteCatalog = createAsyncThunk("[catalogs] delete catalog", async (data: Catalog) => {
        await CatalogsAPI.deleteCatalog(data);
        return data;
    });

    /**
     * Action that fetches the data of a single catalogue from the redux store.
     * @function getCatalogFromRedux
     * @param {string} type - Action type.
     * @returns Action function for getting a catalogue from the redux store.
     */
    static getCatalogFromRedux = createAction<number>("[catalog] get single catalog from redux store");

    /**
     * Action that changes a catalogue.
     * @function setCatalog
     * @param {string} type - Action type.
     * @returns Action function for changing a catalogue.
     */
    static setCatalog = createAction<CatalogWithRole>("[catalogs] set catalog");

    /**
     * Action that removes a catalogue.
     * @function removeCatalog
     * @param {string} type - Action type.
     * @returns Action function for removing a catalogue.
     */
    static removeCatalog = createAction<Catalog>("[catalogs] remove catalog");

    /**
     * Action that changes the role of the user for the current catalog.
     * @function changeOwnCatalogRole
     * @param {string} type - Action type.
     * @returns Action function for changing the users role.
     */
    static changeOwnCatalogRole = createAction<USER_ROLES>("[catalog] change current role");
}
