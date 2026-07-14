import { nanoid } from "@reduxjs/toolkit";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Asset } from "#api/types/asset.types.ts";
import type { ComponentType } from "#api/types/component-types.types.ts";
import type {
    AnchorOrientation,
    AugmentedSystemComponent,
    Component,
    ConnectionAnchor,
    ConnectionPointMeta,
    Coordinate,
    SystemCommunicationInterface,
    SystemComponent,
    SystemConnection,
    SystemPointOfAttack,
} from "#api/types/system.types.ts";
import {
    findBestAnchor,
    anchorPointForComponent,
    reanchorEndpoint,
    reanchorCrossingTerminals,
    snapToGrid,
} from "#utils/connection-waypoints.ts";
import type { EditorConnection, EditorEntityId } from "#application/reducers/editor.reducer.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { PointsOfAttackActions } from "#application/actions/points-of-attack.actions.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import { systemSelectors } from "#application/selectors/system.selectors.ts";
import { useAppDispatch, useAppSelector, useAppStore } from "./use-app-redux.hook";
import {
    computeConnectionRouting,
    hasDrawableLine,
} from "#view/components/editor-components/connection-routing/index.ts";
import { useSystem } from "./use-system.hook";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import { validateConnection } from "#utils/connection-rules.ts";
import { enhanceComponents } from "#utils/enhance-components.ts";
import { buildPointOfAttackPayload } from "#utils/build-point-of-attack-payload.ts";
import type { CreatePointOfAttackArgs } from "#utils/build-point-of-attack-payload.ts";

type EditorConnectionPreview = EditorConnection & {
    from: EditorConnectionAnchor;
    to?: EditorConnectionAnchor;
};

export type EditorConnectionAnchor = ConnectionAnchor & {
    communicationInterfaceId?: string | null;
    component?: SystemComponent;
};

export const useEditor = ({
    projectId,
    showErrorMessage,
}: {
    projectId: number;
    showErrorMessage?: (payload: { message: string }) => void;
}) => {
    const dispatch = useAppDispatch();
    const store = useAppStore();
    const { t, i18n } = useTranslation("editorPage");
    const {
        loadSystem,
        saveSystem,
        components,
        connections,
        pointsOfAttack,
        hasSystemChanged,
        initialized,
        isPending,
    } = useSystem({ projectId });

    const selectedComponentId = useAppSelector(editorSelectors.selectSelectedComponent);

    const startAnchor = useAppSelector(editorSelectors.selectStartAnchor);

    const layerPosition = useAppSelector(editorSelectors.selectLayerPosition);

    /**
     * Used when a component is dragged.
     */
    const showHelpLines = useAppSelector(editorSelectors.selectShowHelpLines);

    const selectedComponent = useAppSelector((state) => systemSelectors.selectComponent(state, selectedComponentId));

    const selectedConnectionId = useAppSelector(editorSelectors.selectSelectedConnection);

    const selectedConnection = useAppSelector((state) =>
        systemSelectors.selectSelectedConnection(state, selectedConnectionId)
    );

    /**
     * When you click on the ring of a component.
     */
    const selectedPointOfAttackId = useAppSelector(editorSelectors.selectSelectedPointOfAttack);

    /**
     * When you click on the ring of a component.
     */
    const selectedPointOfAttack = useAppSelector((state) =>
        systemSelectors.selectPointOfAttack(state, selectedPointOfAttackId)
    );

    /**
     * Holds the new connection when creating one.
     */
    const newConnection = useAppSelector(editorSelectors.selectNewConnection);
    const isConnectionPreview = (connection: EditorConnection | null): connection is EditorConnectionPreview =>
        connection != null && typeof connection === "object" && "from" in connection;

    /**
     * Holds the connection of the currently dragged component.
     */
    const connectionsOfComponent = useAppSelector((state) =>
        systemSelectors.selectConnectionsOfComponent(state, selectedComponentId)
    );

    const selectedConnectionPointId = useAppSelector(editorSelectors.selectSelectedConnectionPoint);

    const selectedConnectionPoint = useAppSelector((state) =>
        systemSelectors.selectConnectionPoint(state, selectedConnectionPointId)
    );

    /**
     * Holds the points of attack of the currently dragged component.
     */
    const pointsOfAttackOfSelectedComponent = useAppSelector((state) =>
        systemSelectors.selectPointsOfAttackOfComponent(state, selectedComponentId)
    );

    const assetSearchValue = useAppSelector(editorSelectors.selectAssetSearchValue);

    /**
     * Holds the scaling factor of the stage.
     */
    const stageScale = useAppSelector(editorSelectors.selectStageScale);

    const stagePosition = useAppSelector(editorSelectors.selectStagePosition);

    const blockAutoSave = useAppSelector(systemSelectors.selectBlockAutoSave);

    /**
     * Holds the connection lines of the dragged component.
     */
    const componentConnectionLines = useAppSelector(editorSelectors.selectComponentConnectionLines);

    /**
     * Indicator that a component is dragged.
     */
    const isAnyComponentInUse = useAppSelector(editorSelectors.selectIsAnyComponentInUse);

    const autoSaveStatus = useAppSelector(editorSelectors.selectAutoSaveStatus);

    /**
     * Flag to indicate that a screenshot is necessary.
     */
    const makeScreenshot = useAppSelector(editorSelectors.selectMakeScreenshot);

    const saveCurrentSystem = ({ image }: { image: string | null | undefined }): void => {
        const saveDate = new Date().toLocaleString(i18n.language);
        dispatch(EditorActions.setLastAutoSaveDate(saveDate));
        saveSystem(image);
    };

    const autoSaveBlocked = (): void => {
        dispatch(SystemActions.autoSavedBlocked());
    };

    const setAutoSaveStatus = (status: string): void => {
        dispatch(EditorActions.setAutoSaveStatus(status));
    };

    const deleteCustomComponent = (data: ComponentType): void => {
        dispatch(EditorActions.deleteComponentType(data));
    };

    const addComponent = ({
        componentType,
        ...component
    }: { componentType: EditorComponentType } & Pick<Component, "x" | "y" | "gridX" | "gridY">): void => {
        const componentId = nanoid();
        dispatch(
            SystemActions.createComponent({
                id: componentId,
                projectId: projectId,
                x: component.x,
                y: component.y,
                gridX: component.gridX,
                gridY: component.gridY,
                type: componentType.id,
                name: componentType.name,
                symbol: componentType.symbol,
            })
        );

        componentType.pointsOfAttack.forEach((type: POINTS_OF_ATTACK) => {
            const pointOfAttackId = nanoid();

            createPointOfAttack({
                id: pointOfAttackId,
                type: type,
                componentId: componentId,
                projectId: projectId,
            });
        });
    };

    const moveComponent = ({ id, x, y, gridX, gridY }: Pick<Component, "id" | "x" | "y" | "gridX" | "gridY">): void => {
        dispatch(
            SystemActions.setComponent({
                id,
                changes: {
                    id,
                    x,
                    y,
                    gridX,
                    gridY,
                },
            })
        );
    };

    const setComponentsGridPosition = ({
        id,
        x,
        y,
        gridX,
        gridY,
    }: Pick<Component, "id" | "x" | "y" | "gridX" | "gridY">): void => {
        dispatch(
            SystemActions.setComponent({
                id,
                changes: {
                    id,
                    x,
                    y,
                    gridX,
                    gridY,
                },
            })
        );
    };

    const setSelectedComponentName = (name: string): void => {
        if (name && name.trim().length > 0 && selectedComponentId) {
            dispatch(
                SystemActions.setComponentName({
                    id: selectedComponentId,
                    changes: { name },
                })
            );
        }
    };

    const setSelectedComponentDescription = (description: string): void => {
        if (!selectedComponentId) {
            return;
        }

        dispatch(
            SystemActions.setComponent({
                id: selectedComponentId,
                changes: { description },
            })
        );
    };

    const setAlwaysShowAnchorsOfComponent = (componentId: string, showAlways: boolean): void => {
        dispatch(
            SystemActions.setComponent({
                id: componentId,
                changes: {
                    alwaysShowAnchors: showAlways,
                },
            })
        );
    };

    const removeComponent = (): void => {
        if (!selectedComponentId) {
            return;
        }

        // Remove the component and everything attached to it first, then re-route the neighbours'
        // remaining connections in one go — otherwise they would route around the not-yet-removed
        // component and its doomed connections.
        const neighbourComponentIds = new Set<string>();
        connectionsOfComponent.forEach((connection) => {
            neighbourComponentIds.add(connection.from.id);
            neighbourComponentIds.add(connection.to.id);
            removeConnectionWithoutRerouting(connection);
        });
        neighbourComponentIds.delete(selectedComponentId);

        pointsOfAttackOfSelectedComponent.forEach((pointOfAttack) => {
            dispatch(
                PointsOfAttackActions.removePointOfAttack({
                    id: pointOfAttack.id,
                })
            );
        });

        dispatch(SystemActions.removeComponent({ id: selectedComponentId }));

        recalculateConnectionsOfComponents([...neighbourComponentIds]);
    };

    /**
     * Routes the given connections one at a time: each route already sees the final lines of the
     * ones routed before it, so two fresh routes cannot cross by accident (which happens when all
     * routes are computed at once, each seeing only the others' old lines). Reads state straight
     * from the store because callers dispatch the change that made routes stale right before.
     */
    const routeConnectionsSequentially = useCallback(
        (connectionIds: Set<string>, connectionIdsToRouteLast = new Set<string>()): void => {
            const state = store.getState();
            const freshComponents = systemSelectors.selectComponents(state, projectId);
            const freshConnections = systemSelectors.selectConnections(state, projectId);
            const componentById = new Map(freshComponents.map((component) => [component.id, component]));

            // Pinned connections are hand-drawn: the auto-router never touches them until the user
            // explicitly unpins/resets them, so exclude them from routing entirely here.
            // Connections whose geometry the edit did not touch route first, so they keep their
            // established lines; the edited ones route last and adapt around them. Id order breaks
            // ties, so the same edit always produces the same layout.
            const connectionsToRoute = freshConnections
                .filter((connection) => connectionIds.has(connection.id) && !connection.pinned)
                .sort((first, second) => {
                    const firstRoutesLast = connectionIdsToRouteLast.has(first.id) ? 1 : 0;
                    const secondRoutesLast = connectionIdsToRouteLast.has(second.id) ? 1 : 0;
                    return firstRoutesLast - secondRoutesLast || first.id.localeCompare(second.id);
                });

            let workingConnections = freshConnections;
            connectionsToRoute.forEach((connection) => {
                const fromComponent = componentById.get(connection.from.id);
                const toComponent = componentById.get(connection.to.id);
                if (!fromComponent || !toComponent) {
                    return;
                }

                const routing = computeConnectionRouting({
                    connectionId: connection.id,
                    fromComponent,
                    toComponent,
                    components: freshComponents,
                    connections: workingConnections,
                    from: connection.from,
                    to: connection.to,
                    pointsOfAttack: connection.pointsOfAttack,
                });
                if (!routing) {
                    // No route possible (e.g. both endpoints on one grid cell) — keep the stored line.
                    return;
                }

                const waypointsUnchanged =
                    routing.waypoints.length === connection.waypoints.length &&
                    routing.waypoints.every((value, index) => value === connection.waypoints[index]);
                if (waypointsUnchanged && connection.recalculate === false) {
                    // Same line as before — skip the dispatch so untouched connections don't mark
                    // the project as changed.
                    return;
                }

                workingConnections = workingConnections.map((other) =>
                    other.id === connection.id ? { ...other, waypoints: routing.waypoints } : other
                );
                dispatch(
                    SystemActions.setConnection({
                        id: connection.id,
                        changes: {
                            waypoints: routing.waypoints,
                            connectionPointsMeta: routing.connectionPointsMeta,
                            recalculate: false,
                        },
                    })
                );
            });
        },
        [store, dispatch, projectId]
    );

    const recalculateConnectionsOfComponents = (
        componentIds: string[],
        connectionIdsToRouteLast?: Set<string>
    ): void => {
        const state = store.getState();
        const freshConnections = systemSelectors.selectConnections(state, projectId);
        const affectedComponents = new Set(componentIds);
        const affectedConnectionIds = new Set(
            freshConnections
                .filter(
                    (connection) =>
                        affectedComponents.has(connection.from.id) || affectedComponents.has(connection.to.id)
                )
                .map((connection) => connection.id)
        );
        routeConnectionsSequentially(affectedConnectionIds, connectionIdsToRouteLast);
    };

    const loadedProjectId = useAppSelector((state) => state.system.loadedProjectId);

    // On load, route only the connections that have no usable line yet; stored routes stay untouched.
    // Keyed on loadedProjectId (set after the system data landed in the store), not on `initialized` —
    // that flag stays true across project switches, so an effect keyed on it would fire before the
    // new project's connections arrive and never again.
    useEffect(() => {
        if (loadedProjectId !== projectId) {
            return;
        }
        const freshConnections = systemSelectors.selectConnections(store.getState(), projectId);
        const connectionIdsWithoutRoute = new Set(
            freshConnections
                .filter((connection) => connection.recalculate || !hasDrawableLine(connection.waypoints))
                .map((connection) => connection.id)
        );
        if (connectionIdsWithoutRoute.size > 0) {
            routeConnectionsSequentially(connectionIdsWithoutRoute);
        }
    }, [loadedProjectId, store, projectId, routeConnectionsSequentially]);

    const removeConnectionWithoutRerouting = (connection: SystemConnection): void => {
        const pointsOfAttackOfConnection = pointsOfAttack.filter((item) => item.connectionId === connection.id);
        pointsOfAttackOfConnection.forEach((pointOfAttack) => {
            dispatch(
                PointsOfAttackActions.removePointOfAttack({
                    id: pointOfAttack.id,
                })
            );
        });

        dispatch(
            SystemActions.removeConnection({
                id: connection.id,
                connectionPoints: connection.connectionPoints,
            })
        );
    };

    const removeConnection = (connection?: SystemConnection | null): void => {
        const targetConnection = connection ?? selectedConnection;
        if (!targetConnection) {
            return;
        }

        removeConnectionWithoutRerouting(targetConnection);
        recalculateConnectionsOfComponents([targetConnection.from.id, targetConnection.to.id]);
    };

    const removeConnectionById = (connectionId: string): void => {
        const connection = connections.find((conn) => conn.id === connectionId);
        if (connection) {
            removeConnection(connection);
        }
    };

    const setConnectionVisibility = (connectionId: string, visible: boolean): void => {
        dispatch(
            SystemActions.setConnection({
                id: connectionId,
                changes: {
                    visible,
                },
            })
        );
    };

    const connectionEdited = (connectionId: string, waypoints: number[]): void => {
        // A drag can leave a terminal's line diving through its own component (the moved segment now
        // approaches from a different side). Snap any such terminal to the face it enters through so
        // the line stops cleanly at the boundary instead of piercing the box.
        let nextWaypoints = waypoints;
        const state = store.getState();
        const connection = systemSelectors.selectConnections(state, projectId).find((item) => item.id === connectionId);
        if (connection && waypoints.length >= 4) {
            const components = systemSelectors.selectComponents(state, projectId);
            const fromComponent = components.find((component) => component.id === connection.from.id);
            const toComponent = components.find((component) => component.id === connection.to.id);
            if (fromComponent && toComponent) {
                // Waypoint order is not tied to from/to identity, so match each terminal to the
                // component it sits nearest before re-anchoring (see updateConnectionsOfComponent).
                const distanceToCenter = (component: typeof fromComponent): number =>
                    Math.hypot(waypoints[0]! - (component.gridX * 5 + 40), waypoints[1]! - (component.gridY * 5 + 40));
                const startNearFrom = distanceToCenter(fromComponent) <= distanceToCenter(toComponent);
                const startComponent = startNearFrom ? fromComponent : toComponent;
                const endComponent = startNearFrom ? toComponent : fromComponent;
                nextWaypoints = reanchorCrossingTerminals(waypoints, startComponent, endComponent);
            }
        }
        // connectionPointsMeta intentionally left stale: the connector renderer reads only `waypoints` for pinned paths.
        dispatch(
            SystemActions.setConnection({
                id: connectionId,
                changes: { waypoints: nextWaypoints, pinned: true, recalculate: false },
            })
        );
    };

    const resetConnectionRouting = (connectionId: string): void => {
        dispatch(
            SystemActions.setConnection({
                id: connectionId,
                changes: { pinned: false, recalculate: true },
            })
        );
        // The engine routes imperatively, so re-route this connection now instead of waiting for one
        // of its components to move. Unpinning above means routeConnectionsSequentially no longer
        // skips it; routing it last lets it adapt around the neighbours' established lines.
        const connection = systemSelectors
            .selectConnections(store.getState(), projectId)
            .find((item) => item.id === connectionId);
        if (connection) {
            recalculateConnectionsOfComponents([connection.from.id, connection.to.id], new Set([connectionId]));
        }
    };

    const setSelectedConnectionName = (name: string): void => {
        if (!selectedConnectionId) {
            return;
        }

        dispatch(
            SystemActions.setConnection({
                id: selectedConnectionId,
                changes: {
                    name,
                },
            })
        );
    };

    const setSelectedConnectionPointDescription = (description: string): void => {
        if (!selectedConnectionPointId) {
            return;
        }

        dispatch(
            SystemActions.setConnectionPoint({
                id: selectedConnectionPointId,
                changes: {
                    description,
                },
            })
        );
    };

    const setSelectedConnectionPointName = (name: string): void => {
        if (!selectedConnectionPointId) {
            return;
        }

        dispatch(
            SystemActions.setConnectionPoint({
                id: selectedConnectionPointId,
                changes: {
                    name,
                },
            })
        );
    };

    const handleChangeCommunicationInterfaceName = (
        componentId: string,
        interfaceId: string,
        newName: string
    ): void => {
        const selectedComponent = components.find((component) => component.id === componentId);
        if (!selectedComponent || !selectedComponent.communicationInterfaces) {
            return;
        }

        const updatedInterfaces = selectedComponent.communicationInterfaces.map((communicationInterface) => {
            if (communicationInterface.id === interfaceId) {
                return { ...communicationInterface, name: newName };
            }
            return communicationInterface;
        });

        dispatch(
            SystemActions.setComponent({
                id: selectedComponent.id,
                changes: {
                    communicationInterfaces: updatedInterfaces,
                },
            })
        );

        dispatch(
            SystemActions.setConnectionPoint({
                id: interfaceId,
                changes: {
                    name: newName,
                },
            })
        );

        dispatch(
            PointsOfAttackActions.setPointOfAttack({
                id: interfaceId,
                changes: {
                    name: newName,
                },
            })
        );
    };

    const addCommunicationInterface = (componentId: string, name: string, icon: string | null): void => {
        const component = components.find((item) => item.id === componentId);
        if (!component) {
            return;
        }

        const communicationInterfaceId = nanoid();
        const createdCommunicationInterface: SystemCommunicationInterface = {
            id: communicationInterfaceId,
            name,
            icon,
            type: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
            projectId,
            componentId,
            componentName: component.name,
        };

        // Create point of attack for threats page
        createPointOfAttack({
            id: communicationInterfaceId,
            name,
            type: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
            componentId,
            projectId,
            componentName: component.name,
            connectionId: null,
            connectionPointId: null,
            assets: [],
        });

        // Create connection point as it still serves as the data infrastructure for the com interfaces
        dispatch(
            SystemActions.createConnectionPoint({
                id: communicationInterfaceId,
                name,
                connectionId: "",
                projectId,
                componentId,
                componentName: component.name,
            })
        );

        // Update the from component with the new communication interface
        const updatedFromComponent = {
            ...component,
            communicationInterfaces: [...(component.communicationInterfaces || []), createdCommunicationInterface],
        };
        dispatch(
            SystemActions.setComponent({
                id: componentId,
                changes: {
                    communicationInterfaces: updatedFromComponent.communicationInterfaces,
                },
            })
        );
    };

    const handleDeleteCommunicationInterface = (componentId: string, interfaceId: string): void => {
        const selectedComponent = components.find((component) => component.id === componentId);
        if (!selectedComponent?.communicationInterfaces) {
            return;
        }

        const updatedInterfaces = selectedComponent.communicationInterfaces.filter(
            (communicationInterface) => communicationInterface.id !== interfaceId
        );

        // Remove com interface from component
        dispatch(
            SystemActions.setComponent({
                id: selectedComponent.id,
                changes: {
                    communicationInterfaces: updatedInterfaces,
                },
            })
        );

        // Remove point of attack
        removePointOfAttack({
            id: interfaceId,
        });

        // Remove connection point, this is the data infrastructure for the com interfaces
        dispatch(
            SystemActions.removeConnectionPoint({
                id: interfaceId,
            })
        );

        // Find and remove connections that have this interfaceId
        const connectionsToRemove = Object.values(connections).filter(
            (connection) =>
                connection.from.id === componentId && connection.from.communicationInterfaceId === interfaceId
        );

        connectionsToRemove.forEach((connection) => {
            removeConnectionById(connection.id);
        });
    };

    const selectComponent = (componentId: string): void => {
        dispatch(EditorActions.selectComponent(componentId));
    };

    const deselectComponent = (): void => {
        dispatch(EditorActions.deselectComponent());
    };

    const selectConnector = (connector: EditorConnectionAnchor): void => {
        // First connection, set the from, start connection preview
        if (!isConnectionPreview(newConnection)) {
            dispatch(
                EditorActions.setConnection({
                    from: connector,
                })
            );
        } else if (
            connector.id !== newConnection.from.id ||
            (connector.id === newConnection.from.id && connector.anchor !== newConnection.from.anchor)
        ) {
            // Second connection, set the to, end connection preview, dispatch create connection
            const connectionId = nanoid();
            const connectionPoints: string[] = [];
            const connectionPointsMeta: ConnectionPointMeta[] = [];
            const waypoints: number[] = [];
            const from = newConnection.from;
            const to = connector;
            const fromComponent = components.find((component) => component.id === from.id);
            const toComponent = components.find((component) => component.id === to.id);

            if (!fromComponent || !toComponent) {
                return;
            }

            // Check connection rules
            const validation = validateConnection(from, to);
            if (!validation.ok) {
                showErrorMessage?.({
                    message: t(validation.messageKey),
                });
                return;
            }

            dispatch(
                SystemActions.createConnection({
                    id: connectionId,
                    name: t("connection") + ": " + fromComponent.name + " -> " + toComponent.name,
                    from,
                    to,
                    connectionPoints,
                    connectionPointsMeta,
                    waypoints,
                    recalculate: true,
                    projectId,
                    communicationInterfaceId: from.communicationInterfaceId ?? null,
                    communicationInterface: null,
                })
            );

            // The new connection routes last, adapting around its siblings' established lines.
            recalculateConnectionsOfComponents([from.id, to.id], new Set([connectionId]));

            dispatch(EditorActions.resetConnection());
        }
    };

    const deselectConnector = (): void => {
        dispatch(EditorActions.deselectConnector());
    };

    const selectConnection = (connectionId: string): void => {
        if (!connectionId) {
            return;
        }

        dispatch(EditorActions.selectConnection(connectionId));
    };

    const deselectConnection = (): void => {
        dispatch(EditorActions.deselectConnection());
    };

    const setLayerPosition = (x: number, y: number): void => {
        dispatch(EditorActions.setLayerPosition({ x, y }));
    };

    const setStageScale = (newScale: number, newPos: Coordinate): void => {
        dispatch(
            EditorActions.setStageScale({
                scale: newScale,
                position: newPos,
            })
        );
    };

    const setShowHelpLines = (show: boolean): void => {
        dispatch(EditorActions.setShowHelpLines(show));
    };

    const addPointOfAttack = (component: AugmentedSystemComponent, type: POINTS_OF_ATTACK): void => {
        const pointOfAttackId = nanoid();

        createPointOfAttack({
            id: pointOfAttackId,
            componentId: component.id,
            projectId,
            type,
        });
    };

    const removePointOfAttack = (pointOfAttack: Pick<SystemPointOfAttack, "id">): void => {
        dispatch(
            PointsOfAttackActions.removePointOfAttack({
                id: pointOfAttack.id,
            })
        );
    };

    const selectPointOfAttack = (pointOfAttackId: string | null): void => {
        if (pointOfAttackId) {
            dispatch(EditorActions.selectPointOfAttack(pointOfAttackId));
        }
    };

    const deselectPointOfAttack = (): void => {
        dispatch(EditorActions.deselectPointOfAttack());
    };

    const addAssetToSelectedPointOfAttack = (asset: Asset): void => {
        if (!selectedPointOfAttack) {
            return;
        }

        const newAssets = [...selectedPointOfAttack.assets];
        newAssets.push(asset.id);

        dispatch(
            PointsOfAttackActions.setPointOfAttack({
                id: selectedPointOfAttack.id,
                changes: {
                    assets: newAssets,
                },
            })
        );
    };

    const removeAssetToSelectedPointOfAttack = (asset: Asset): void => {
        if (!selectedPointOfAttack) {
            return;
        }

        const newAssets = [...selectedPointOfAttack.assets];
        newAssets.splice(newAssets.indexOf(asset.id), 1);

        dispatch(
            PointsOfAttackActions.setPointOfAttack({
                id: selectedPointOfAttack.id,
                changes: {
                    assets: newAssets,
                },
            })
        );
    };

    const updateConnectionsOfComponent = (movedComponentId?: string): void => {
        // The moved component is the one being dragged; callers that don't pass it fall back to the
        // current selection (during a drag the moved component is the selected one).
        const targetComponentId = movedComponentId ?? selectedComponentId;
        if (!targetComponentId) {
            return;
        }
        // Read components and connections from the store, not the render snapshot — the move that
        // made these routes stale was dispatched in the same tick, and pinned re-anchoring needs the
        // moved component's new position.
        const state = store.getState();
        const freshComponents = systemSelectors.selectComponents(state, projectId);
        const freshConnections = systemSelectors.selectConnections(state, projectId);
        const movedComponent = freshComponents.find((component) => component.id === targetComponentId);
        const componentById = new Map(freshComponents.map((component) => [component.id, component]));

        const affectedComponents = new Set<string>();
        const movedConnectionIds = new Set<string>();

        freshConnections.forEach((connection) => {
            if (connection.from.id !== targetComponentId && connection.to.id !== targetComponentId) {
                return;
            }

            if (connection.pinned) {
                // Hand-drawn line: the auto-router leaves it alone (see routeConnectionsSequentially),
                // so we glue its moved terminal to the component's new anchor ourselves.
                if (!movedComponent) {
                    return;
                }
                // A pinned path missing or too short to re-anchor can't keep its terminal glued to the
                // moved component. Unpin it and mark it for recalculation so the auto-router re-routes
                // it cleanly (a still-pinned connection is skipped by the router forever) instead of
                // detaching. Left for the engine to route on the next pass rather than routed here.
                if (!connection.waypoints || connection.waypoints.length < 4) {
                    dispatch(
                        SystemActions.setConnection({
                            id: connection.id,
                            changes: { pinned: false, recalculate: true },
                        })
                    );
                    return;
                }
                const otherComponentId =
                    connection.from.id === targetComponentId ? connection.to.id : connection.from.id;
                const otherComponent = componentById.get(otherComponentId);
                if (!otherComponent) {
                    return;
                }
                const orientation = findBestAnchor(movedComponent, otherComponent);
                const rawAnchor = anchorPointForComponent(movedComponent, orientation);
                const snapped = { x: snapToGrid(rawAnchor.x), y: snapToGrid(rawAnchor.y) };
                // Waypoint order is NOT tied to from/to identity: the renderer stores
                // whichever of the two A* paths (from->to or to->from) yields fewer points,
                // so the moved component's terminal may sit at either end of the array.
                // Pick the endpoint to re-anchor by proximity to the *other* (stationary)
                // component — its terminal stays adjacent to it, so the far terminal is the
                // moved component's.
                const waypoints = connection.waypoints;
                const otherCenterX = otherComponent.x + otherComponent.width / 2;
                const otherCenterY = otherComponent.y + otherComponent.height / 2;
                const startToOther = Math.hypot(waypoints[0]! - otherCenterX, waypoints[1]! - otherCenterY);
                const endToOther = Math.hypot(
                    waypoints[waypoints.length - 2]! - otherCenterX,
                    waypoints[waypoints.length - 1]! - otherCenterY
                );
                const which = startToOther < endToOther ? "end" : "start";
                const gluedWaypoints = reanchorEndpoint(waypoints, which, snapped, orientation);
                // Gluing only the moved terminal can leave the stationary one anchored to a face the
                // line no longer approaches cleanly — the moved component crossed to a new side, so the
                // path now dives into the stationary box and leaves a stub. Re-anchor any such pierced
                // terminal to the face it now enters through.
                const startComponent = which === "start" ? movedComponent : otherComponent;
                const endComponent = which === "start" ? otherComponent : movedComponent;
                const newWaypoints = reanchorCrossingTerminals(gluedWaypoints, startComponent, endComponent);
                // connectionPointsMeta intentionally left stale: the connector renderer reads only `waypoints` for pinned paths.
                dispatch(
                    SystemActions.setConnection({
                        id: connection.id,
                        changes: { waypoints: newWaypoints, recalculate: false },
                    })
                );
                return;
            }

            // Unpinned: route through the engine. Collect both endpoints so the neighbours' other
            // connections keep their established lines, and mark this one to route last so it adapts
            // around them.
            affectedComponents.add(connection.from.id);
            affectedComponents.add(connection.to.id);
            movedConnectionIds.add(connection.id);
        });

        recalculateConnectionsOfComponents([...affectedComponents], movedConnectionIds);
    };

    const standardComponents = useAppSelector(editorSelectors.selectStandardComponents);

    const enhancedComponents = useMemo(() => {
        return enhanceComponents(components, standardComponents, selectedComponentId, startAnchor);
    }, [components, standardComponents, selectedComponentId, startAnchor]);

    const selectConnectionPoint = (connectionId: string): void => {
        dispatch(EditorActions.selectConnectionPoint(connectionId));
    };

    const deselectConnectionPoint = (): void => {
        dispatch(EditorActions.deselectConnectionPoint());
    };

    const addAssetToPointOfAttack = (asset: Asset, pointOfAttack: SystemPointOfAttack): void => {
        const newAssets = [...pointOfAttack.assets];
        if (newAssets.includes(asset.id)) {
            return;
        }

        newAssets.push(asset.id);

        dispatch(
            PointsOfAttackActions.setPointOfAttack({
                id: pointOfAttack.id,
                changes: {
                    assets: newAssets,
                },
            })
        );
    };

    const removeAssetFromPointOfAttack = (asset: Asset, pointOfAttack: SystemPointOfAttack): void => {
        const newAssets = [...pointOfAttack.assets];
        if (!newAssets.includes(asset.id)) {
            return;
        }

        newAssets.splice(newAssets.indexOf(asset.id), 1);

        dispatch(
            PointsOfAttackActions.setPointOfAttack({
                id: pointOfAttack.id,
                changes: {
                    assets: newAssets,
                },
            })
        );
    };

    const setAssetSearchValue = (value: string): void => {
        dispatch(EditorActions.setAssetSearchValue(value));
    };

    const loadComponentTypes = useCallback((): void => {
        dispatch(EditorActions.getComponentTypes({ projectId }));
    }, [projectId, dispatch]);

    const createPointOfAttack = (data: CreatePointOfAttackArgs): void => {
        dispatch(PointsOfAttackActions.createPointOfAttack(buildPointOfAttackPayload(data)));
    };

    const addComponentConnectionLine = (
        draggedComponentId: string,
        draggedComponentAnchor: AnchorOrientation,
        otherComponentId: string,
        otherComponentAnchor: AnchorOrientation
    ): void => {
        const id = nanoid();

        dispatch(
            EditorActions.addComponentConnectionLine({
                id,
                draggedComponentInfo: {
                    id: draggedComponentId,
                    anchor: draggedComponentAnchor,
                },
                otherComponentInfo: {
                    id: otherComponentId,
                    anchor: otherComponentAnchor,
                },
            })
        );
    };

    const removeComponentConnectionLine = (componentConnectionLineId: string): void => {
        dispatch(
            EditorActions.removeComponentConnectionLine({
                id: componentConnectionLineId,
            })
        );
    };

    const clearComponentConnectionLines = (): void => {
        dispatch(EditorActions.clearComponentConnectionLines());
    };

    const addInUseComponent = (componentId: EditorEntityId): void => {
        dispatch(EditorActions.addInUseComponent(componentId));
    };

    const removeInUseComponent = (componentId: EditorEntityId): void => {
        dispatch(EditorActions.removeInUseComponent(componentId));
    };

    return {
        deleteCustomComponent,
        autoSaveBlocked,
        addComponent,
        moveComponent,
        selectComponent,
        deselectComponent,
        removeComponent,
        selectConnector,
        deselectConnector,
        selectConnection,
        deselectConnection,
        loadSystem,
        systemPending: isPending,
        saveCurrentSystem,
        setLayerPosition,
        setShowHelpLines,
        setComponentsGridPosition,
        setSelectedComponentName,
        setSelectedComponentDescription,
        setSelectedConnectionPointDescription,
        addPointOfAttack,
        removePointOfAttack,
        removeConnection,
        removeConnectionById,
        selectPointOfAttack,
        deselectPointOfAttack,
        addAssetToSelectedPointOfAttack,
        removeAssetToSelectedPointOfAttack,
        updateConnectionsOfComponent,
        selectConnectionPoint,
        deselectConnectionPoint,
        addAssetToPointOfAttack,
        removeAssetFromPointOfAttack,
        setAssetSearchValue,
        setStageScale,
        loadComponentTypes,
        setConnectionVisibility,
        connectionEdited,
        resetConnectionRouting,
        setAlwaysShowAnchorsOfComponent,
        addComponentConnectionLine,
        removeComponentConnectionLine,
        clearComponentConnectionLines,
        addInUseComponent,
        removeInUseComponent,
        setSelectedConnectionName,
        setSelectedConnectionPointName,
        setAutoSaveStatus,
        initialized,
        components: enhancedComponents,
        connections,
        hasSystemChanged,
        layerPosition,
        showHelpLines,
        selectedComponent,
        selectedComponentId,
        selectedConnectionId,
        selectedPointOfAttack,
        selectedConnection,
        selectedConnectionPointId,
        stageScale,
        stagePosition,
        newConnection,
        pointsOfAttackOfSelectedComponent,
        assetSearchValue,
        blockAutoSave,
        connectionsOfComponent,
        componentConnectionLines,
        isAnyComponentInUse,
        selectedConnectionPoint,
        autoSaveStatus,
        makeScreenshot,
        handleChangeCommunicationInterfaceName,
        handleDeleteCommunicationInterface,
        addCommunicationInterface,
    };
};
