/**
 * @module catalogs.reducer - Reducer
 *     for the catalogues.
 */

import { createReducer } from "@reduxjs/toolkit";
import { USER_ROLES } from "../../api/types/user-roles.types";
import { CatalogsActions } from "../actions/catalogs.actions";
import { catalogsAdapter } from "../adapters/catalogs.adapter";

/**
 * Initial state of the catalogues.
 *
 * @type {array of number} ids - ids of the catalogues.
 * @type {object of objects} entities - Holds the catalogues mapped to their id.
 *    Entity: @type {number} Key - id of the entity.
 *    Values:
 *         => @type {number} id - id of the catalogue.
 *         => @type {string} name - The name of the catalogue.
 *         => @type {string} language - The chosen language.
 *         => @type {string} updatedAt - Timestamp when this catalogue got updated last.
 *         => @type {string} createdAt - Timestamp when this catalogue was created.
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 */
const defaultState = {
    ...catalogsAdapter.getInitialState(),
    isPending: false,
    current: {},
};

/**
 * Reducer for the actions of the catalogues.
 *
 * @function catalogsReducer
 */
const catalogsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(CatalogsActions.getCatalogs.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(CatalogsActions.getCatalogs.fulfilled, (state, action) => {
        catalogsAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.getCatalogs.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.getCatalogFromBackend.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(CatalogsActions.getCatalogFromBackend.fulfilled, (state, action) => {
        state.current = action.payload;
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.getCatalogFromBackend.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.createCatalog.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(CatalogsActions.createCatalog.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.getCatalogFromRedux, (state, action) => {
        state.current = state.entities[action.payload];
    });

    builder.addCase(CatalogsActions.setCatalog, (state, action) => {
        action.payload.role = USER_ROLES.OWNER;

        catalogsAdapter.upsertOne(state, action.payload);
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.removeCatalog, (state, action) => {
        catalogsAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
    });

    builder.addCase(CatalogsActions.changeOwnCatalogRole, (state, action) => {
        const { role } = action.payload;
        const { id } = state.current;

        if (state.entities[id]) state.entities[id].role = role;
        state.current.role = role;
    });
});

export default catalogsReducer;
