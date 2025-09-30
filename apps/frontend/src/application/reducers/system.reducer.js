/**
 * @module system.reducer - Defines the reducer for
 *     the projects.
 */

import { createReducer } from "@reduxjs/toolkit";
import { PointsOfAttackActions } from "../actions/points-of-attack.actions";
import { SystemActions } from "../actions/system.actions";
import { pointsOfAttackAdapter } from "../adapters/points-of-attack.adapter";
import { systemComponentsAdapter } from "../adapters/system-components.adapter";
import { systemConnectionPointsAdapter } from "../adapters/system-connection-point.adapter";
import { systemConnectionsAdapter } from "../adapters/system-connections.adapter";

/**
 * Initial state of a system.
 *
 * @type {array of number} ids - The id of the saved system.
 * @type {object} components - Wrapper object for the underlying adapter.
 *     @type {array of string} ids - ids of the components.
 *     @type {object of objects} entities - Maps the ids to the data of the components.
 *        Entity: @type {string} Key - id of the entity.
 *        Values:
 *             => @type {string} id - id of the system.
 *             => @type {string} name - The name of the component.
 *             => @type {string} type - The type of the component.
 *             => @type {number} x - X coordinate of the component.
 *             => @type {number} y - Y coordinate of the component.
 *             => @type {number} gridX - GridX coordinate of the component.
 *             => @type {number} gridY - GridY coordinate of the component.
 *             => @type {number} width - Width of the component.
 *             => @type {number} height - Height of the component.
 *             => @type {boolean} selected - Indicator if the component is selected.
 *             => @type {number} projectId - id of the project the component belongs to.
 *             => @type {string} symbol - Path of the image used as an icon.
 *             => @type {number} alwaysShowAnchors - Indicator to always show the anchoring.
 *
 * @type {object} connections - Wrapper object for the underlying adapter.
 *     @type {array of string} ids - ids of the connections.
 *     @type {object of objects} entities - Maps the ids to the data of the connections.
 *        Entity: @type {string} Key - id of the entity.
 *        Values:
 *             => @type {string} id - id of the connection.
 *             => @type {string} name - The name of the connection.
 *             => @type {object} from - Marks the start of a connection.
 *             => @type {object} to - Marks the end of a connection.
 *             => @type {object} connectionPoints - Marks the points that are connected with another.
 *             => @type {object} connectionPointsMeta - Contains extra information about the connected points.
 *             => @type {array of number} waypoints - Waypoint data to form clean lines.
 *             => @type {boolean} recalculate - Indicator that this connection will be recalculated.
 *             => @type {number} projectId - id of the project the connection belongs to.
 *             => @type {boolean} visible - Indicator that this component is visible.
 *
 * @type {object} connectionPoints - Wrapper object for the underlying adapter.
 *     @type {array of string} ids - ids of the connection points.
 *     @type {object of objects} entities - Maps the ids to the data of the connection points.
 *        Entity: @type {string} Key - id of the entity.
 *        Values:
 *             => @type {string} id - id of the connection point.
 *             => @type {string} name - The name of the connection point.
 *             => @type {string} connectionId - id of the involved connection.
 *             => @type {number} projectId - id of the underlying project.
 *
 * @type {object} pointsOfAttack - Wrapper object for the underlying adapter.
 *     @type {array of string} ids - ids of the attack points.
 *     @type {object of objects} entities - Maps the ids to the data of the attack points.
 *        Entity: @type {string} Key - id of the entity.
 *        Values:
 *             => @type {string} id - id of the attack point.
 *             => @type {string} type - The type of the attack point.
 *             => @type {string} componentId - id of the involved component.
 *             => @type {number} projectId - id of the underlying project.
 *
 * @type {boolean} isPending - Indicator if a request to the backend is still pending.
 * @type {boolean} initialized - Indicator if the component has been initialised.
 * @type {boolean} hasChanged - Indicator that the component has changed.
 * @type {boolean} blockAutoSave - Indicator that autosave is blocked.
 * @type {number} refreshCounter - Count of refreshes of the page.
 */
const defaultState = {
    id: null,
    components: systemComponentsAdapter.getInitialState(),
    connections: systemConnectionsAdapter.getInitialState(),
    connectionPoints: systemConnectionPointsAdapter.getInitialState(),
    pointsOfAttack: pointsOfAttackAdapter.getInitialState(),
    isPending: false,
    initialized: false,
    hasChanged: false,
    blockAutoSave: false,
    refreshCounter: 0,
};

/**
 * Reducer for the incoming system actions.
 * @function systemReducer
 */
const systemReducer = createReducer(defaultState, (builder) => {
    builder.addCase(SystemActions.getSystem.pending, (state) => {
        state.isPending = true;
    });

    builder.addCase(SystemActions.createComponent, (state, action) => {
        systemComponentsAdapter.addOne(state.components, {
            id: action.payload.id,
            name: action.payload.name,
            type: action.payload.type,
            x: action.payload.x,
            y: action.payload.y,
            gridX: action.payload.gridX,
            gridY: action.payload.gridY,
            width: 80,
            height: 80,
            selected: false,
            projectId: action.payload.projectId,
            symbol: action.payload.symbol,
            alwaysShowAnchors: false,
        });
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.setComponents, (state, action) => {
        systemComponentsAdapter.upsertMany(state.components, action);
        state.hasChanged = true;
    });

    builder.addCase(SystemActions.setComponent, (state, action) => {
        systemComponentsAdapter.updateOne(state.components, action);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.removeComponent, (state, action) => {
        systemComponentsAdapter.removeOne(state.components, action.payload.id);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.createConnection, (state, action) => {
        systemConnectionsAdapter.addOne(state.connections, {
            id: action.payload.id,
            name: action.payload.name,
            from: action.payload.from,
            to: action.payload.to,
            connectionPoints: action.payload.connectionPoints,
            connectionPointsMeta: action.payload.connectionPointsMeta,
            waypoints: action.payload.waypoints,
            recalculate: action.payload.recalculate,
            projectId: action.payload.projectId,
            visible: true,
            communicationInterface: action.payload.communicationInterface,
        });
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.setConnections, (state, action) => {
        systemConnectionsAdapter.upsertMany(state.connections, action);
        state.hasChanged = true;
    });

    builder.addCase(SystemActions.setConnection, (state, action) => {
        systemConnectionsAdapter.updateOne(state.connections, action);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.removeConnection, (state, action) => {
        systemConnectionsAdapter.removeOne(state.connections, action.payload.id);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.setPendingState, (state, action) => {
        state.isPending = action.payload;
    });

    builder.addCase(SystemActions.setHasChanged, (state, action) => {
        state.hasChanged = action.payload;
    });

    builder.addCase(SystemActions.setComponentName, (state, action) => {
        systemComponentsAdapter.updateOne(state.components, action);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(PointsOfAttackActions.createPointOfAttack, (state, action) => {
        pointsOfAttackAdapter.addOne(state.pointsOfAttack, {
            id: action.payload.id,
            type: action.payload.type,
            componentId: action.payload.componentId,
            connectionId: action.payload.connectionId,
            projectId: action.payload.projectId,
            connectionPointId: action.payload.connectionPointId,
            name: action.payload.name,
            componentName: action.payload.componentName,
            assets: [],
        });
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(PointsOfAttackActions.setPointOfAttack, (state, action) => {
        pointsOfAttackAdapter.updateOne(state.pointsOfAttack, action.payload);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(PointsOfAttackActions.setPointsOfAttack, (state, action) => {
        pointsOfAttackAdapter.upsertMany(state.pointsOfAttack, action);
        state.hasChanged = true;
    });

    builder.addCase(PointsOfAttackActions.removePointOfAttack, (state, action) => {
        pointsOfAttackAdapter.removeOne(state.pointsOfAttack, action.payload.id);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(PointsOfAttackActions.removePointsOfAttack, (state, action) => {
        pointsOfAttackAdapter.removeMany(state.pointsOfAttack, action);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.clearSystem, () => {
        return defaultState;
    });

    builder.addCase(SystemActions.setSystemId, (state, action) => {
        state.id = action.payload;
    });

    builder.addCase(SystemActions.createConnectionPoint, (state, action) => {
        systemConnectionPointsAdapter.addOne(state.connectionPoints, {
            id: action.payload.id,
            name: action.payload.name,
            connectionId: action.payload.connectionId,
            projectId: action.payload.projectId,
            componentId: action.payload.componentId,
            componentName: action.payload.componentName,
        });
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.setConnectionPoints, (state, action) => {
        systemConnectionPointsAdapter.upsertMany(state.connectionPoints, action);
    });

    builder.addCase(SystemActions.setConnectionPoint, (state, action) => {
        systemConnectionPointsAdapter.updateOne(state.connectionPoints, action.payload);
        state.hasChanged = true;
    });

    builder.addCase(SystemActions.removeConnectionPoint, (state, action) => {
        systemConnectionPointsAdapter.removeOne(state.connectionPoints, action.payload.id);
        state.hasChanged = true;
        state.blockAutoSave = true;
    });

    builder.addCase(SystemActions.refresh, (state) => {
        state.refreshCounter += 1;
    });

    builder.addCase(SystemActions.updateSystem.fulfilled, (state) => {
        state.hasChanged = false;
    });

    builder.addCase(SystemActions.autoSavedBlocked, (state) => {
        state.blockAutoSave = false;
    });

    builder.addCase(SystemActions.setAutoSavedBlocked, (state, action) => {
        state.blockAutoSave = action.payload;
    });

    builder.addCase(SystemActions.setInitialized, (state, action) => {
        state.initialized = action.payload;
    });
});

export default systemReducer;
