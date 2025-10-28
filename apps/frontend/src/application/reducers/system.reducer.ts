import { createReducer } from "@reduxjs/toolkit";
import { PointsOfAttackActions } from "../actions/points-of-attack.actions";
import { SystemActions } from "../actions/system.actions";
import { pointsOfAttackAdapter, type SystemPointOfAttack } from "../adapters/points-of-attack.adapter";
import { systemComponentsAdapter } from "../adapters/system-components.adapter";
import { systemConnectionPointsAdapter, type SystemConnectionPoint } from "../adapters/system-connection-point.adapter";
import { systemConnectionsAdapter } from "../adapters/system-connections.adapter";
import type { SystemConnection, SystemPointOfAttack } from "#api/types/system.types.ts";

type ComponentsState = ReturnType<typeof systemComponentsAdapter.getInitialState>;
type ConnectionsState = ReturnType<typeof systemConnectionsAdapter.getInitialState>;
type ConnectionPointsState = ReturnType<typeof systemConnectionPointsAdapter.getInitialState>;
type PointsOfAttackState = ReturnType<typeof pointsOfAttackAdapter.getInitialState>;

export interface SystemState {
    id: number | null;
    components: ComponentsState;
    connections: ConnectionsState;
    connectionPoints: ConnectionPointsState;
    pointsOfAttack: PointsOfAttackState;
    isPending: boolean;
    initialized: boolean;
    hasChanged: boolean;
    blockAutoSave: boolean;
    refreshCounter: number;
}

const defaultState: SystemState = {
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
        const systemConnections: SystemConnection[] = action.payload.map((connection) => ({
            communicationInterface: state.connections.entities[connection.id]?.communicationInterface ?? null,
            ...connection,
        }));

        systemConnectionsAdapter.upsertMany(state.connections, { payload: systemConnections, type: action.type });
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
        const pointsOfAttack: SystemPointOfAttack[] = action.payload.map((pointOfAttack) => ({
            componentName: state.pointsOfAttack.entities[pointOfAttack.id]?.componentName ?? null,
            ...pointOfAttack,
        }));

        pointsOfAttackAdapter.upsertMany(state.pointsOfAttack, { payload: pointsOfAttack, type: action.type });
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
        const systemConnectionPoints: SystemConnectionPoint[] = action.payload.map((connectionPoint) => ({
            componentId: state.connectionPoints.entities[connectionPoint.id]?.componentId ?? null,
            componentName: state.connectionPoints.entities[connectionPoint.id]?.componentName ?? null,
            ...connectionPoint,
        }));

        systemConnectionPointsAdapter.upsertMany(state.connectionPoints, {
            payload: systemConnectionPoints,
            type: action.type,
        });
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
