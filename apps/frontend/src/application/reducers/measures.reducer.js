/**
 * @module measures.reducer - Defines the reducer for
 *     the measures.
 */

import { createReducer } from "@reduxjs/toolkit";
import { MeasuresActions } from "../actions/measures.actions";
import { measuresAdapter } from "../adapters/measures.adapter";

/**
 * Initial state of the planned measures in the risk view.
 *
 * @type {object} measures - Wrapper object for the underlying adapter.
 *     @type {array of number} ids - ids of the measures.
 *     @type {object of objects} entities - Maps the ids to the data of the measures.
 *        Entity: @type {number} Key - id of the entity.
 *        Values:
 *             => @type {number} id - id of the measure.
 *             => @type {string} name - The name of the measure.
 *             => @type {string} description - The description of the measure.
 *             => @type {number} probability - The probability that of the measure.
 *             => @type {number} damage - The damage reduction of the measure.
 *             => @type {string} scheduledAt - Deadline for the measure realisation.
 *             => @type {string} createdAt - Timestamp when this measure was created.
 *             => @type {string} updatedAt - Timestamp when this measure was created.
 *             => @type {number} threatId - id of the involved threat.
 *             => @type {number} catalogMeasureId - id of the catalogue measure involved.
 *             => @type {number} projectId - id of the project.
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 */
const defaultState = {
    ...measuresAdapter.getInitialState(),
    isPending: false,
};

/**
 * Reducer to mutate the state based on the incoming
 * measure actions.
 * @function measuresReducer
 */
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
