import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "#application/store.ts";
import type { SystemState } from "#application/reducers/system.reducer.ts";
import { systemComponentsAdapter, type SystemComponent } from "../adapters/system-components.adapter";
import { systemConnectionsAdapter, type SystemConnection } from "../adapters/system-connections.adapter";
import { systemConnectionPointsAdapter, type SystemConnectionPoint } from "../adapters/system-connection-point.adapter";
import { pointsOfAttackAdapter, type SystemPointOfAttack } from "../adapters/points-of-attack.adapter";

type AugmentedSystemComponent = SystemComponent & { pointsOfAttack: SystemPointOfAttack[] };

type AugmentedSystemConnection = SystemConnection & {
    from: SystemConnection["from"] & { component: SystemComponent | undefined };
    to: SystemConnection["to"] & { component: SystemComponent | undefined };
    pointsOfAttack: SystemPointOfAttack[];
};

const selectSystemState = (state: RootState): SystemState => state.system;
const selectProjectId = (_state: RootState, projectId: number | null | undefined) => projectId;
const selectComponentId = (_state: RootState, componentId: string | null | undefined) => componentId;
const selectConnectionId = (_state: RootState, connectionId: string | null | undefined) => connectionId;
const selectPointOfAttackId = (_state: RootState, pointOfAttackId: string | null | undefined) => pointOfAttackId;
const selectConnectionPointId = (_state: RootState, connectionPointId: string | null | undefined) => connectionPointId;

const { selectAll: selectAllComponents, selectEntities: selectComponentEntities } =
    systemComponentsAdapter.getSelectors((state: RootState) => selectSystemState(state).components);

const { selectAll: selectAllConnections, selectEntities: selectConnectionEntities } =
    systemConnectionsAdapter.getSelectors((state: RootState) => selectSystemState(state).connections);

const { selectAll: selectAllPointsOfAttack } = pointsOfAttackAdapter.getSelectors(
    (state: RootState) => selectSystemState(state).pointsOfAttack
);

const { selectAll: selectAllConnectionPoints, selectEntities: selectConnectionPointEntities } =
    systemConnectionPointsAdapter.getSelectors((state: RootState) => selectSystemState(state).connectionPoints);

export const systemSelectors = {
    /**
     * Fetches all components of the current project
     * and maps them with their points of attack.
     * @returns The components with their attack points as an array.
     */
    selectComponents: createSelector(
        [selectAllComponents, selectAllPointsOfAttack, selectProjectId],
        (components, pointsOfAttack, projectId): AugmentedSystemComponent[] => {
            if (projectId == null) {
                return [];
            }

            return components
                .filter((component) => component.projectId === projectId)
                .map((component) => ({
                    ...component,
                    pointsOfAttack: pointsOfAttack.filter(
                        (point) => point.componentId === component.id && point.projectId === component.projectId
                    ),
                }));
        }
    ),

    /**
     * Gets the connections of the system as an array.
     * @returns The connections with their components and points of attack.
     */
    selectConnections: createSelector(
        [selectComponentEntities, selectAllConnections, selectAllPointsOfAttack, selectProjectId],
        (componentEntities, connections, pointsOfAttack, projectId): AugmentedSystemConnection[] => {
            if (projectId == null) {
                return [];
            }

            return connections
                .filter((connection) => connection.projectId === projectId)
                .map((connection) => ({
                    ...connection,
                    from: {
                        ...connection.from,
                        component: componentEntities[connection.from.id],
                    },
                    to: {
                        ...connection.to,
                        component: componentEntities[connection.to.id],
                    },
                    pointsOfAttack: pointsOfAttack.filter(
                        (point) => point.connectionId === connection.id && point.projectId === connection.projectId
                    ),
                }));
        }
    ),

    selectHasChanged: createSelector([selectSystemState], (system): SystemState["hasChanged"] => system.hasChanged),

    selectBlockAutoSave: createSelector(
        [selectSystemState],
        (system): SystemState["blockAutoSave"] => system.blockAutoSave
    ),

    /**
     * Gets the component with the specified component id.
     * @return A component with its points of attack.
     */
    selectComponent: createSelector(
        [selectComponentEntities, selectAllPointsOfAttack, selectComponentId],
        (componentEntities, pointsOfAttack, componentId): AugmentedSystemComponent | undefined => {
            if (!componentId) {
                return undefined;
            }

            const component = componentEntities[componentId];

            if (!component) {
                return undefined;
            }

            return {
                ...component,
                pointsOfAttack: pointsOfAttack.filter(
                    (point) => point.componentId === component.id && point.projectId === component.projectId
                ),
            };
        }
    ),

    /**
     * Gets the point of attack with the specified attack point id.
     * @returns The point of attack.
     */
    selectPointOfAttack: createSelector(
        [selectAllPointsOfAttack, selectPointOfAttackId],
        (pointsOfAttack, pointOfAttackId): SystemPointOfAttack | undefined => {
            if (!pointOfAttackId) {
                return undefined;
            }

            return pointsOfAttack.find((point) => point.id === pointOfAttackId);
        }
    ),

    /**
     * Gets multiple points of attack.
     * @return An array of attack points.
     */
    selectPointsOfAttack: createSelector(
        [selectAllPointsOfAttack, selectProjectId],
        (pointsOfAttack, projectId): SystemPointOfAttack[] => {
            if (projectId == null) {
                return [];
            }

            return pointsOfAttack.filter((pointOfAttack) => pointOfAttack.projectId === projectId);
        }
    ),

    /**
     * Gets all the connection of the specified component.
     * @returns An array of connection from the component.
     */
    selectConnectionsOfComponent: createSelector(
        [selectAllConnections, selectComponentId],
        (connections, componentId): SystemConnection[] => {
            if (!componentId) {
                return [];
            }

            return connections.filter(
                (connection) => connection.from.id === componentId || connection.to.id === componentId
            );
        }
    ),

    /**
     * Gets the selected connection.
     * @returns The selected connection.
     */
    selectSelectedConnection: createSelector(
        [selectConnectionEntities, selectConnectionId],
        (connectionEntities, connectionId): SystemConnection | undefined => {
            if (!connectionId) {
                return undefined;
            }

            return connectionEntities[connectionId];
        }
    ),

    /**
     * Gets all connectionPoints of the Project
     * @return The connectionPoints.
     */
    selectConnectionPoints: createSelector(
        [selectAllConnectionPoints, selectProjectId],
        (connectionPoints, projectId): SystemConnectionPoint[] => {
            if (projectId == null) {
                return [];
            }

            return connectionPoints.filter((connectionPoint) => connectionPoint.projectId === projectId);
        }
    ),

    /**
     * Gets the selected connection interface.
     * @return The selected connection interface.
     */
    selectConnectionPoint: createSelector(
        [selectConnectionPointEntities, selectConnectionPointId],
        (connectionPointEntities, connectionPointId): SystemConnectionPoint | undefined => {
            if (!connectionPointId) {
                return undefined;
            }

            return connectionPointEntities[connectionPointId];
        }
    ),

    /**
     * Gets the points of attack from the specified component.
     * @returns An array of attack points.
     */
    selectPointsOfAttackOfComponent: createSelector(
        [selectAllPointsOfAttack, selectComponentId],
        (pointsOfAttack, componentId): SystemPointOfAttack[] => {
            if (!componentId) {
                return [];
            }

            return pointsOfAttack.filter((pointOfAttack) => pointOfAttack.componentId === componentId);
        }
    ),
};
