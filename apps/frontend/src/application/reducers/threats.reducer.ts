import { createReducer } from "@reduxjs/toolkit";
import { ThreatsActions } from "../actions/threats.actions";
import { threatAdapter } from "../adapters/threats.adapter";
import type { ExtendedThreat } from "#api/types/threat.types.ts";

type ThreatsAdapterState = ReturnType<typeof threatAdapter.getInitialState>;

export type ThreatsState = ThreatsAdapterState & {
    isPending: boolean;
};

const defaultState: ThreatsState = {
    ...threatAdapter.getInitialState(),
    isPending: false,
};

const threatsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(ThreatsActions.getThreats.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(ThreatsActions.getThreats.fulfilled, (state, action) => {
        threatAdapter.setAll(state, action);
        state.isPending = false;
    });

    builder.addCase(ThreatsActions.getThreats.rejected, (state) => {
        state.isPending = false;
    });

    builder.addCase(ThreatsActions.createThreat.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(ThreatsActions.setThreat, (state, action) => {
        const extendedThreat: ExtendedThreat = {
            componentName: state.entities[action.payload.id]?.componentName ?? null,
            componentType: state.entities[action.payload.id]?.componentType ?? null,
            interfaceName: state.entities[action.payload.id]?.interfaceName ?? null,
            assets: state.entities[action.payload.id]?.assets ?? [],
            ...action.payload,
        };

        threatAdapter.upsertOne(state, extendedThreat);
        state.isPending = false;
    });

    builder.addCase(ThreatsActions.removeThreat, (state, action) => {
        threatAdapter.removeOne(state, action.payload.id);
        state.isPending = false;
    });

    builder.addCase(ThreatsActions.createThreat.rejected, (state) => {
        state.isPending = false;
    });
});

export default threatsReducer;
