import { createReducer } from "@reduxjs/toolkit";
import { MeasureImpactsActions } from "#application/actions/measureImpacts.actions.ts";
import { measureImpactsAdapter } from "#application/adapters/measureImpactsAdapter.ts";

type MeasureImpactsAdapterState = ReturnType<typeof measureImpactsAdapter.getInitialState>;

export type MeasureImpactsState = MeasureImpactsAdapterState & {
    isPending: boolean;
};

const defaultState: MeasureImpactsState = {
    ...measureImpactsAdapter.getInitialState(),
    isPending: false,
};

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
