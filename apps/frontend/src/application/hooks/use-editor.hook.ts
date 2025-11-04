import { nanoid } from "@reduxjs/toolkit";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { batch } from "react-redux";
import type { Asset } from "#api/types/asset.types.ts";
import type { ComponentType } from "#api/types/component-types.types.ts";
import type { AnchorOrientation, Component, ConnectionAnchor, ConnectionPointMeta } from "#api/types/system.types.ts";
import type { SystemCommunicationInterface, SystemComponent } from "#application/adapters/system-components.adapter.ts";
import type { SystemConnection } from "#application/adapters/system-connections.adapter.ts";
import type { SystemPointOfAttack } from "#application/adapters/points-of-attack.adapter.ts";
import type { EditorConnection, EditorEntityId, EditorPosition } from "#application/reducers/editor.reducer.ts";
import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";
import { EditorActions } from "../actions/editor.actions";
import { PointsOfAttackActions } from "../actions/points-of-attack.actions";
import { SystemActions } from "../actions/system.actions";
import { editorSelectors } from "../selectors/editor.selectors";
import { systemSelectors } from "../selectors/system.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";
import { useSystem } from "./use-system.hook";
import type { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";

let lastMousePointerUpdate = 0;

type AugmentedSystemComponent = ReturnType<typeof systemSelectors.selectComponents>[number];

type EditorConnectionPreview = EditorConnection & {
    from: EditorConnectionAnchor;
    to?: EditorConnectionAnchor;
};

type EditorConnectionAnchor = (ConnectionAnchor & {
    communicationInterfaceId?: string | null;
    component?: SystemComponent;
}) & {
    anchor: AnchorOrientation;
};

type CreatePointOfAttackArgs = Pick<SystemPointOfAttack, "id" | "type" | "projectId" | "componentId"> &
    Partial<Omit<SystemPointOfAttack, "id" | "type" | "projectId" | "componentId">>;

export const useEditor = ({
    projectId,
    showErrorMessage,
}: {
    projectId: number;
    showErrorMessage?: (payload: { message: string }) => void;
}) => {
    const dispatch = useAppDispatch();
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

    const mousePointers = useAppSelector(editorSelectors.selectMousePointers);

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

    /**
     * Effect that emits that a user left the current project.
     */
    useEffect(() => {
        return () => {
            /* empty */
        };
    }, [projectId]);

    const saveCurrentSystem = ({ image }: { image: string | null }): void => {
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
    }: { componentType: ComponentType } & Pick<Component, "x" | "y" | "gridX" | "gridY">): void => {
        batch(() => {
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
        });
    };

    const moveComponent = ({ id, x, y, gridX, gridY }: Component): void => {
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

    const setComponentsGridPosition = ({ id, x, y, gridX, gridY }: Component): void => {
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

        batch(() => {
            connectionsOfComponent.forEach((connection) => {
                removeConnection(connection);
            });

            pointsOfAttackOfSelectedComponent.forEach((pointOfAttack) => {
                dispatch(
                    PointsOfAttackActions.removePointOfAttack({
                        id: pointOfAttack.id,
                    })
                );
            });

            dispatch(SystemActions.removeComponent({ id: selectedComponentId }));
        });
    };

    const removeConnection = (connection?: SystemConnection | null): void => {
        const targetConnection = connection ?? selectedConnection;
        if (!targetConnection) {
            return;
        }

        batch(() => {
            const pointsOfAttackOfConnection = pointsOfAttack.filter(
                (item) => item.connectionId === targetConnection.id
            );
            pointsOfAttackOfConnection.forEach((pointOfAttack) => {
                dispatch(
                    PointsOfAttackActions.removePointOfAttack({
                        id: pointOfAttack.id,
                    })
                );
            });

            dispatch(
                SystemActions.removeConnection({
                    id: targetConnection.id,
                    connectionPoints: targetConnection.connectionPoints,
                })
            );
        });
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
        if (!selectedComponent || !selectedComponent.communicationInterfaces) {
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

    const isSystemOrCustomComponent = (type: EditorConnectionAnchor["type"]): boolean => {
        return ["CLIENT", "SERVER", "DATABASE"].includes(type as STANDARD_COMPONENT_TYPES) || typeof type === "number";
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
            batch(() => {
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
                if (from.type === "USERS") {
                    if (!isSystemOrCustomComponent(to.type)) {
                        showErrorMessage?.({
                            message: t("errors.userConnectionInvalid"),
                        });
                        return;
                    }
                } else if (to.type === "USERS") {
                    if (!isSystemOrCustomComponent(from.type)) {
                        showErrorMessage?.({
                            message: t("errors.componentToUserInvalid"),
                        });
                        return;
                    }
                } else if (isSystemOrCustomComponent(from.type)) {
                    if (to.type !== "COMMUNICATION_INFRASTRUCTURE" || !from.communicationInterfaceId) {
                        showErrorMessage?.({
                            message: t("errors.componentToCommunicationInfraInvalid"),
                        });
                        return;
                    }
                } else if (from.type === "COMMUNICATION_INFRASTRUCTURE") {
                    if (!isSystemOrCustomComponent(to.type) || !to.communicationInterfaceId) {
                        showErrorMessage?.({
                            message: t("errors.communicationInfraToComponentInvalid"),
                        });
                        return;
                    }
                } else {
                    showErrorMessage?.({
                        message: t("errors.invalidConnection"),
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

                dispatch(EditorActions.resetConnection());
            });
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

    const setStageScale = (newScale: number, newPos: EditorPosition): void => {
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

    const updateConnectionsOfComponent = (): void => {
        connectionsOfComponent.forEach((connection) => {
            dispatch(
                SystemActions.setConnection({
                    id: connection.id,
                    changes: {
                        recalculate: true,
                    },
                })
            );
        });
    };

    const connectionRecalculated = (
        connectionId: string,
        waypoints: number[],
        connectionPointsMeta: ConnectionPointMeta[]
    ): void => {
        dispatch(
            SystemActions.setConnection({
                id: connectionId,
                changes: {
                    waypoints,
                    connectionPointsMeta,
                    recalculate: false,
                },
            })
        );
    };

    const standardComponents = useAppSelector(editorSelectors.selectStandardComponents);

    const enhancedComponents = useMemo(() => {
        return components.map((c) => {
            // Finde die Standardkomponente, die dem Typ von c entspricht
            const standardComponent = standardComponents.find((sc) => sc.id === c.type);

            return {
                ...c,
                selected: selectedComponentId === c.id,
                startAnchor,
                // Setze das Symbol basierend auf der gefundenen Standardkomponente
                symbol: standardComponent ? standardComponent.symbol : c.symbol,
            };
        });
    }, [components, standardComponents, selectedComponentId, startAnchor]);

    const selectConnectionPoint = (connectionId: string): void => {
        dispatch(EditorActions.selectConnectionPoint(connectionId));
    };

    const deselectConnectionPoint = (): void => {
        dispatch(EditorActions.deselectConnectionPoint());
    };

    const setMousePointers = (_position: EditorPosition): void => {
        const now = performance.now();
        const diff = now - lastMousePointerUpdate;
        if (diff > 0) {
            lastMousePointerUpdate = now;
        }
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
        const payload: SystemPointOfAttack = {
            id: data.id,
            type: data.type,
            projectId: data.projectId,
            componentId: data.componentId,
            connectionId: data.connectionId ?? null,
            connectionPointId: data.connectionPointId ?? null,
            name: data.name ?? null,
            componentName: data.componentName ?? null,
            assets: data.assets ?? [],
        };

        dispatch(PointsOfAttackActions.createPointOfAttack(payload));
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
        connectionRecalculated,
        selectConnectionPoint,
        deselectConnectionPoint,
        setMousePointers,
        addAssetToPointOfAttack,
        removeAssetFromPointOfAttack,
        setAssetSearchValue,
        setStageScale,
        loadComponentTypes,
        setConnectionVisibility,
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
        mousePointers,
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
