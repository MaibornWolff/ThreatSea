/**
 * @module catalog-measures.reducer - Reducer
 *     for the catalogues measures.
 */

import { createReducer } from "@reduxjs/toolkit";
import { CatalogMeasuresActions } from "../actions/catalog-measures.actions";
import { catalogMeasuresAdapter } from "../adapters/catalog-measures.adapter";
import { catalogThreatsAdapter } from "../adapters/catalog-threats.adapter";

/**
 * Initial state of the catalogue measures.
 *
 * @type {array of number} ids - ids of the catalogue measures.
 * @type {object of objects} entities - Holds the catalogue measures mapped to their id.
 *    Entity: @type {number} Key - id of the entity.
 *    Values:
 *         => @type {number} id - id of the catalogue measure.
 *         => @type {string} name - The name of the catalogue measure.
 *         => @type {string} description - The description of the catalogue measure.
 *         => @type {string} pointOfAttack - The type of the attack point.
 *         => @type {string} attacker - The type of attacker.
 *         => @type {number} probability - How effective the measure is, 1-5.
 *         => @type {boolean} confidentiality - If the confidentiality is affected.
 *         => @type {boolean} integrity - If the integrity is affected.
 *         => @type {boolean} availability - If the availability is affected.
 *         => @type {string} createdAt - Timestamp when this measure got created.
 *         => @type {string} updatedAt - Timestamp when this measure got updated last.
 *         => @type {number} catalogId - id of the catalogue this measures belongs to.
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 */
const defaultState = {
    ...catalogMeasuresAdapter.getInitialState(),
    isPending: false,
};

/**
 * Catalogue measures reducer.
 *
 * Handles the async request for fetching measures and
 * changing/deleting over a socket connection.
 *
 * @function catalogMeasuresReducer
 */
const catalogMeasuresReducer = createReducer(defaultState, (builder) => {
    builder.addCase(CatalogMeasuresActions.getCatalogMeasures.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(CatalogMeasuresActions.getCatalogMeasures.fulfilled, (state, action) => {
        catalogMeasuresAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(CatalogMeasuresActions.getCatalogMeasures.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(CatalogMeasuresActions.setCatalogMeasure, (state, action) => {
        catalogThreatsAdapter.upsertOne(state, action.payload);
    });

    builder.addCase(CatalogMeasuresActions.removeCatalogMeasure, (state, action) => {
        catalogThreatsAdapter.removeOne(state, action.payload.id);
    });
});

export default catalogMeasuresReducer;
