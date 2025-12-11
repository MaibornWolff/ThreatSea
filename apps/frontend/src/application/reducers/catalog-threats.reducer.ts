import { createReducer } from "@reduxjs/toolkit";
import { CatalogThreatsActions } from "../actions/catalog-threats.actions";
import { catalogThreatsAdapter } from "../adapters/catalog-threats.adapter";

type CatalogThreatsAdapterState = ReturnType<typeof catalogThreatsAdapter.getInitialState>;

export type CatalogThreatsState = CatalogThreatsAdapterState & {
    isPending: boolean;
};

const defaultState: CatalogThreatsState = {
    ...catalogThreatsAdapter.getInitialState(),
    isPending: false,
};

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
