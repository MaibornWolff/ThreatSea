/**
 * @module threats.reducer - Defines the reducer for
 *     the threats view.
 */

import { createReducer } from "@reduxjs/toolkit";
import { ThreatsActions } from "../actions/threats.actions";
import { threatAdapter } from "../adapters/threats.adapter";

/**
 * Initial state of the threats.
 *
 * @type {array of number} ids - ids of the threats.
 * @type {object of objects} entities - Maps the ids to the data of the threats.
 *    Entity: @type {number} Key - id of the entity.
 *    Values:
 *         => @type {number} id - id of the threat.
 *         => @type {string} pointOfAttackId - The involved point of attack.
 *         => @type {string} name - Name of the threat.
 *         => @type {string} description - The description of the threat.
 *         => @type {string} pointOfAttack - Type of the involved point of attack.
 *         => @type {string} attacker - The type of attacker.
 *         => @type {number} probability - The probability of the thread.
 *         => @type {boolean} confidentiality - Indicator if the confidentiality is affected.
 *         => @type {boolean} integrity - Indicator that the integrity is affected.
 *         => @type {boolean} availability - Indicator that the availability is affected.
 *         => @type {string} createdAt - Timestamp when this threat was created.
 *         => @type {string} updatedAt - Timestamp when this threat was updated last.
 *         => @type {number} catalogueThreatId - id of the catalogue threat.
 *         => @type {number} projectId - id of the project.
 *         => @type {string} componentName - Name of the component involved.
 *         => @type {string} componentType - Type of the component involved.
 *         => @type {array of objects} assets - All assets affected by this threat.
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 */
const defaultState = {
    ...threatAdapter.getInitialState(),
    isPending: false,
};

/**
 * Reducer to change the state based upon incoming actions.
 * @function threatsReducer
 */
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
        threatAdapter.upsertOne(state, action.payload);
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
