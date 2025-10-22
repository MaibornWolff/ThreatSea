import { createReducer } from "@reduxjs/toolkit";
import { CatalogMeasuresActions } from "../actions/catalog-measures.actions";
import { catalogMeasuresAdapter } from "../adapters/catalog-measures.adapter";
import { catalogThreatsAdapter } from "../adapters/catalog-threats.adapter";

type CatalogMeasuresAdapterState = ReturnType<typeof catalogMeasuresAdapter.getInitialState>;

export type CatalogMeasuresState = CatalogMeasuresAdapterState & {
    isPending: boolean;
};

const defaultState: CatalogMeasuresState = {
    ...catalogMeasuresAdapter.getInitialState(),
    isPending: false,
};

/**
 * Handles the async request for fetching measures and
 * changing/deleting over a socket connection.
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
