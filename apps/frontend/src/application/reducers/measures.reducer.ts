import { createReducer } from "@reduxjs/toolkit";
import { MeasuresActions } from "../actions/measures.actions";
import { measuresAdapter } from "../adapters/measures.adapter";

type MeasuresAdapterState = ReturnType<typeof measuresAdapter.getInitialState>;

export type MeasuresState = MeasuresAdapterState & {
    isPending: boolean;
};

const defaultState: MeasuresState = {
    ...measuresAdapter.getInitialState(),
    isPending: false,
};

const measuresReducer = createReducer(defaultState, (builder) => {
    builder.addCase(MeasuresActions.getMeasures.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(MeasuresActions.getMeasures.fulfilled, (state, action) => {
        measuresAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(MeasuresActions.getMeasures.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(MeasuresActions.setMeasure, (state, action) => {
        measuresAdapter.upsertOne(state, action.payload);
        state.isPending = false;
    });

    builder.addCase(MeasuresActions.removeMeasure, (state, action) => {
        measuresAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
    });
});

export default measuresReducer;
