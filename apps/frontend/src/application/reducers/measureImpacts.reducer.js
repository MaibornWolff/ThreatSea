/**
 * @module measureImpacts.reducer - Defines the reducer for
 *     the measures.
 */

import { MeasureImpactsActions } from "../actions/measureImpacts.actions";
import { measureImpactsAdapter } from "../adapters/measureImpactsAdapter";
import { createReducer } from "@reduxjs/toolkit";

const defaultState = {
    ...measureImpactsAdapter.getInitialState(),
    isPending: false,
};

/**
 * Reducer to mutate the state based on the incoming
 * measureImpacts actions.
 * @function measureImpactsReducer
 */
const measureImpactsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(MeasureImpactsActions.getMeasureImpacts.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(MeasureImpactsActions.getMeasureImpacts.fulfilled, (state, action) => {
        measureImpactsAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(MeasureImpactsActions.getMeasureImpacts.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(MeasureImpactsActions.setMeasureImpact, (state, action) => {
        measureImpactsAdapter.upsertOne(state, action.payload);
        state.isPending = false;
    });

    builder.addCase(MeasureImpactsActions.removeMeasureImpact, (state, action) => {
        measureImpactsAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
    });
});

export default measureImpactsReducer;
