import { createReducer } from "@reduxjs/toolkit";
import { ThreatsActions } from "#application/actions/threats.actions.ts";
import { threatAdapter } from "#application/adapters/threats.adapter.ts";

type ThreatsState = ReturnType<typeof threatAdapter.getInitialState> & {
    isPending: boolean;
    // project of the load in flight, so a second load for it is skipped
    pendingProjectId: number | null;
    // only the latest load may apply its result; an older one finishing late is ignored
    latestRequestId: string | null;
};

const defaultState: ThreatsState = {
    ...threatAdapter.getInitialState(),
    isPending: false,
    pendingProjectId: null,
    latestRequestId: null,
};

const threatsReducer = createReducer(defaultState, (builder) => {
    builder.addCase(ThreatsActions.getThreats.pending, (state, action) => {
        state.isPending = true;
        state.pendingProjectId = action.meta.arg.projectId;
        state.latestRequestId = action.meta.requestId;
    });

    builder.addCase(ThreatsActions.getThreats.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestRequestId) {
            return;
        }
        threatAdapter.setAll(state, action.payload);
        state.isPending = false;
        state.pendingProjectId = null;
    });

    builder.addCase(ThreatsActions.getThreats.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestRequestId) {
            return;
        }
        // keep the threats already loaded; the error middleware reports the failure
        state.isPending = false;
        state.pendingProjectId = null;
    });
});

export default threatsReducer;
