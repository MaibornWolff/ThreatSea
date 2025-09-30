/**
 * @module catalog-threats.reducer - Reducer
 *     for the catalogues threats.
 */

import { createReducer } from "@reduxjs/toolkit";
import { CatalogThreatsActions } from "../actions/catalog-threats.actions";
import { catalogThreatsAdapter } from "../adapters/catalog-threats.adapter";

/**
 * Initial state of the catalogue threats.
 *
 * @type {array of number} ids - ids of the catalogue threats.
 * @type {object of objects} entities - Holds the catalogue threats mapped to their id.
 *    Entity: @type {number} Key - id of the entity.
 *    Values:
 *         => @type {number} id - id of the catalogue threat.
 *         => @type {string} name - The name of the catalogue threat.
 *         => @type {string} description - The Description of the catalogue threat.
 *         => @type {string} pointOfAttack - The type of the attack point.
 *         => @type {string} attacker - The type of the attacker.
 *         => @type {number} probability - The probability that this threat gets real.
 *         => @type {boolean} confidentiality - If the confidentiality is affected.
 *         => @type {boolean} availability - If the availability is affected.
 *         => @type {boolean} integrity - If the integrity is affected.
 *         => @type {boolean} isDefault -  If the threat is default?
 *         => @type {string} updatedAt - Timestamp when this threat got updated last.
 *         => @type {string} createdAt - Timestamp when this threat was created.
 *         => @type {number} catalogId - id of the catalogue this threat belongs to.
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 */
const defaultState = {
    ...catalogThreatsAdapter.getInitialState(),
    isPending: false,
};

/**
 * Reducer for the incoming actions of the catalogue threats.
 * @function catalogThreatsReducer
 */
const catalogThreatsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(CatalogThreatsActions.getCatalogThreats.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(CatalogThreatsActions.getCatalogThreats.fulfilled, (state, action) => {
        catalogThreatsAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(CatalogThreatsActions.getCatalogThreats.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(CatalogThreatsActions.setCatalogThreat, (state, action) => {
        catalogThreatsAdapter.upsertOne(state, action.payload);
    });

    builder.addCase(CatalogThreatsActions.removeCatalogThreat, (state, action) => {
        catalogThreatsAdapter.removeOne(state, action.payload.id);
    });
});

export default catalogThreatsReducer;
