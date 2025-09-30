/**
 * @module system.selectors - Defines
 *     selectors for the system.
 */

import { createSelector } from "@reduxjs/toolkit";

/**
 * Wrapper object for the selectors of
 * the system.
 */
const systemSelectors = {
    /**
     * Fetches all components of the current project
     * and maps them with their points of attack.
     * @returns The components with their attack points as an array.
     */
    selectComponents: createSelector(
        [
            (state) => state.system.components.entities,
            (state) => state.system.pointsOfAttack.entities,
            (state, projectId) => projectId,
        ],
        (components, pointsOfAttack, projectId) => {
            return Object.values(components)
                .filter((item) => item.projectId === projectId)
                .map((item) => {
                    return {
                        ...item,
                        pointsOfAttack: Object.values(pointsOfAttack).filter(
                            (pointOfAttack) =>
                                pointOfAttack.componentId === item.id && pointOfAttack.projectId === item.projectId
                        ),
                    };
                });
        }
    ),

    /**
     * Gets the connections of the system as an array.
     * @returns The connections with their components and points of attack.
     */
    selectConnections: createSelector(
        [
            (state) => state.system.components.entities,
            (state) => state.system.connections.entities,
            (state) => state.system.pointsOfAttack.entities,
            (state, projectId) => projectId,
        ],
        (components, connections, pointsOfAttack, projectId) => {
            return Object.values(connections)
                .filter((item) => item.projectId === projectId)
                .map((item) => ({
                    ...item,
                    from: {
                        ...item.from,
                        component: components[item.from.id],
                    },
                    to: {
                        ...item.to,
                        component: components[item.to.id],
                    },
                    pointsOfAttack: Object.values(pointsOfAttack).filter(
                        (pointOfAttack) =>
                            pointOfAttack.connectionId === item.id && pointOfAttack.projectId === item.projectId
                    ),
                }));
        }
    ),

    selectHasChanged: createSelector([(state) => state.system.hasChanged], (state) => state),

    selectBlockAutoSave: createSelector([(state) => state.system.blockAutoSave], (state) => state),

    /**
     * Gets the component with the specified component id.
     * @return A component with its points of attack.
     */
    selectComponent: createSelector(
        [
            (state) => state.system.components.entities,
            (state) => state.system.pointsOfAttack.entities,
            (_, componentId) => componentId,
        ],
        (components, pointsOfAttack, componentId) => {
            return Object.values(components)
                .filter((item) => item.id === componentId)
                .map((item) => {
                    return {
                        ...item,
                        pointsOfAttack: Object.values(pointsOfAttack).filter(
                            (pointOfAttack) =>
                                pointOfAttack.componentId === item.id && pointOfAttack.projectId === item.projectId
                        ),
                    };
                })[0];
        }
    ),

    /**
     * Gets the point of attack with the specified attack point id.
     * @returns The point of attack.
     */
    selectPointOfAttack: createSelector(
        [(state) => state.system.pointsOfAttack.entities, (state, pointOfAttackId) => pointOfAttackId],
        (pointsOfAttack, pointOfAttackId) => {
            return Object.values(pointsOfAttack).filter((item) => item.id === pointOfAttackId)[0];
        }
    ),

    /**
     * Gets multiple points of attack.
     * @return An array of attack points.
     */
    selectPointsOfAttack: createSelector(
        [(state) => state.system.pointsOfAttack.entities, (state, projectId) => projectId],
        (pointsOfAttack, projectId) => {
            return Object.values(pointsOfAttack).filter((pointOfAttack) => pointOfAttack.projectId === projectId);
        }
    ),

    /**
     * Gets all the connection of the specified component.
     * @returns An array of connection from the component.
     */
    selectConnectionsOfComponent: createSelector(
        [(state) => state.system.connections.entities, (state, componentId) => componentId],
        (connections, componentId) => {
            return Object.values(connections).filter(
                (item) => item.from.id === componentId || item.to.id === componentId
            );
        }
    ),

    /**
     * Gets the selected connection.
     * @returns The selected connection.
     */
    selectSelectedConnection: createSelector(
        [(state) => state.system.connections.entities, (state, connectionId) => connectionId],
        (connections, connectionId) => {
            return Object.values(connections).filter((item) => item.id === connectionId)[0];
        }
    ),

    /**
     * Gets all connectionPoints of the Project
     * @return The connectionPoints.
     */
    selectConnectionPoints: createSelector(
        [(state) => state.system.connectionPoints.entities, (state, projectId) => projectId],
        (connectionPoints, projectId) => {
            return Object.values(connectionPoints).filter((item) => item.projectId === projectId);
        }
    ),

    /**
     * Gets the selected connection interface.
     * @return The selected connection interface.
     */
    selectConnectionPoint: createSelector(
        [(state) => state.system.connectionPoints.entities, (state, connectionPointId) => connectionPointId],
        (connectionPoints, connectionPointId) => {
            return Object.values(connectionPoints).filter((item) => item.id === connectionPointId)[0];
        }
    ),

    /**
     * Gets the points of attack from the specified component.
     * @returns An array of attack points.
     */
    selectPointsOfAttackOfComponent: createSelector(
        [(state) => state.system.pointsOfAttack.entities, (state, componentId) => componentId],
        (pointsOfAttack, componentId) => {
            return Object.values(pointsOfAttack).filter((item) => item.componentId === componentId);
        }
    ),
};

export default systemSelectors;
