/**
 * @module use-editor.hook - Custom hook
 *     for the editor page.
 */

import { nanoid } from "@reduxjs/toolkit";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { batch, useDispatch, useSelector } from "react-redux";
import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";
import { AssetsActions } from "../actions/assets.actions";
import { EditorActions } from "../actions/editor.actions";
import { PointsOfAttackActions } from "../actions/points-of-attack.actions";
import { SystemActions } from "../actions/system.actions";
import editorSelectors from "../selectors/editor.selectors";
import systemSelectors from "../selectors/system.selectors";
import { useSystem } from "./use-system.hook";

let lastMousePointerUpdate = 0;

/**
 * Creates a custom hook for the editor page.
 * @param {number} projectId - id of the current project.
 * @returns Editor hook.
 */
export const useEditor = ({ projectId, showErrorMessage }) => {
    const dispatch = useDispatch();
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

    /**
     * Get the id of the currently used component.
     * @type {string}
     */
    const selectedComponentId = useSelector(editorSelectors.selectSelectedComponent);

    const startAnchor = useSelector(editorSelectors.selectStartAnchor);

    /**
     * x and y coordinates of the layout.
     * @type {array of number}
     */
    const layerPosition = useSelector(editorSelectors.selectLayerPosition);

    /**
     * Flag if help lines should be shown.
     * Used when a component is dragged.
     * @type {boolean}
     */
    const showHelpLines = useSelector(editorSelectors.selectShowHelpLines);

    /**
     * Holds the currently selected component.
     * @type {object}
     */
    const selectedComponent = useSelector((state) => systemSelectors.selectComponent(state, selectedComponentId));

    /**
     * Holds the currently selected connection id.
     * @type {string}
     */
    const selectedConnectionId = useSelector(editorSelectors.selectSelectedConnection);

    /**
     * Holds the currently selected connection.
     * @type {object}
     */
    const selectedConnection = useSelector((state) =>
        systemSelectors.selectSelectedConnection(state, selectedConnectionId)
    );

    /**
     * Holds the currently selected point of attack id.
     * When you click on the ring of a component.
     * @type {string}
     */
    const selectedPointOfAttackId = useSelector(editorSelectors.selectSelectedPointOfAttack);

    /**
     * Holds the currently selected point of attack. Same as above.
     * @type {object}
     */
    const selectedPointOfAttack = useSelector((state) =>
        systemSelectors.selectPointOfAttack(state, selectedPointOfAttackId)
    );

    /**
     * Holds the new connection when creating one.
     * @type {object}
     */
    const newConnection = useSelector(editorSelectors.selectNewConnection);

    /**
     * Holds the connection of the currently dragged component.
     * @type {array of object}
     */
    const connectionsOfComponent = useSelector((state) =>
        systemSelectors.selectConnectionsOfComponent(state, selectedComponentId)
    );

    /**
     * Holds the currently selected connection interface id.
     * @type {string}
     */
    const selectedConnectionPointId = useSelector(editorSelectors.selectSelectedConnectionPoint);

    /**
     * Holds the currently selected connection interface.
     * @type {object}
     */
    const selectedConnectionPoint = useSelector((state) =>
        systemSelectors.selectConnectionPoint(state, selectedConnectionPointId)
    );

    /**
     * Holds the points of attack of the currently dragged component.
     * @type {array of object}
     */
    const pointsOfAttackOfSelectedComponent = useSelector((state) =>
        systemSelectors.selectPointsOfAttackOfComponent(state, selectedComponentId)
    );

    /**
     * Has the search string for the asset filter.
     * @type {string}
     */
    const assetSearchValue = useSelector(editorSelectors.selectAssetSearchValue);

    /**
     * Holds the mouse pointers of the users.
     * @type {array of object}
     */
    const mousePointers = useSelector(editorSelectors.selectMousePointers);

    /**
     * Holds the scaling factor of the stage.
     * @type {number}
     */
    const stageScale = useSelector(editorSelectors.selectStageScale);

    /**
     * Holds the x and y stage position.
     * @type {object of number}
     */
    const stagePosition = useSelector(editorSelectors.selectStagePosition);

    /**
     * Flag for blocking the auto save.
     * @type {boolean}
     */
    const blockAutoSave = useSelector(systemSelectors.selectBlockAutoSave);

    /**
     * Holds the connection lines of the dragged component.
     * @type {array}
     */
    const componentConnectionLines = useSelector(editorSelectors.selectComponentConnectionLines);

    /**
     * Indicator that a component is dragged.
     * @type {boolean}
     */
    const isAnyComponentInUse = useSelector(editorSelectors.selectIsAnyComponentInUse);

    /**
     * String that shows which status the auto save currently has.
     * @type {string}
     */
    const autoSaveStatus = useSelector(editorSelectors.selectAutoSaveStatus);

    /**
     * Flag to indicate that a screenshot is necessary.
     * @type {boolean}
     */
    const makeScreenshot = useSelector(editorSelectors.selectMakeScreenshot);

    /**
     * Effect that emits that a user left the current project.
     */
    useEffect(() => {
        return () => {};
    }, [projectId]);

    const saveCurrentSystem = ({ image }) => {
        const saveDate = new Date().toLocaleString(i18n.language);
        dispatch(EditorActions.setLastAutoSaveDate(saveDate));
        saveSystem(image);
    };

    /**
     * Wrapper function to block the auto save when
     *
     */
    const autoSaveBlocked = () => {
        dispatch(SystemActions.autoSavedBlocked());
    };

    const setAutoSaveStatus = (status) => {
        dispatch(EditorActions.setAutoSaveStatus(status));
    };

    const deleteCustomComponent = (data) => {
        dispatch(EditorActions.deleteComponentType(data));
    };

    const addComponent = ({ componentType, ...component }) => {
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

            componentType.pointsOfAttack.forEach((type) => {
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

    const moveComponent = ({ componentId, x, y, gridX, gridY }) => {
        dispatch(
            SystemActions.setComponent({
                id: componentId,
                changes: {
                    id: componentId,
                    x: x,
                    y: y,
                    gridX: gridX,
                    gridY: gridY,
                },
            })
        );
    };

    const setComponentsGridPosition = (componentId, x, y, gridX, gridY) => {
        dispatch(
            SystemActions.setComponent({
                id: componentId,
                changes: {
                    id: componentId,
                    x: x,
                    y: y,
                    gridX: gridX,
                    gridY: gridY,
                },
            })
        );
    };

    const setSelectedComponentName = (name) => {
        if (!!name && name.trim().length > 0) {
            dispatch(
                SystemActions.setComponentName({
                    id: selectedComponentId,
                    changes: { name: name },
                })
            );
        }
    };

    const setSelectedComponentDescription = (description) => {
        dispatch(
            SystemActions.setComponent({
                id: selectedComponentId,
                changes: { description: description },
            })
        );
    };

    const setAlwaysShowAnchorsOfComponent = (componentId, showAlways) => {
        dispatch(
            SystemActions.setComponent({
                id: componentId,
                changes: {
                    alwaysShowAnchors: showAlways,
                },
            })
        );
    };

    const removeComponent = () => {
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

    const removeConnection = (connection = selectedConnection) => {
        batch(() => {
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
        });
    };

    const removeConnectionById = (connectionId) => {
        const connection = connections.find((conn) => conn.id === connectionId);
        if (connection) {
            removeConnection(connection);
        }
    };

    const setConnectionVisibility = (connectionId, visible) => {
        dispatch(
            SystemActions.setConnection({
                id: connectionId,
                changes: {
                    visible: visible,
                },
            })
        );
    };

    const setSelectedConnectionName = (name) => {
        dispatch(
            SystemActions.setConnection({
                id: selectedConnectionId,
                changes: {
                    name: name,
                },
            })
        );
    };

    const setSelectedConnectionPointDescription = (description) => {
        dispatch(
            SystemActions.setConnectionPoint({
                id: selectedConnectionPointId,
                changes: {
                    description: description,
                },
            })
        );
    };

    const setSelectedConnectionPointName = (name) => {
        dispatch(
            SystemActions.setConnectionPoint({
                id: selectedConnectionPointId,
                changes: {
                    name: name,
                },
            })
        );
    };

    const handleChangeCommunicationInterfaceName = (componentId, interfaceId, newName) => {
        const selectedComponent = components.filter((component) => component.id === componentId)[0];
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

    const addCommunicationInterface = (componentId, name, icon) => {
        const component = components.filter((component) => component.id === componentId)[0];

        const createdCommunicationInterface = {
            id: nanoid(),
            name: name,
            icon: icon,
            type: POINTS_OF_ATTACK.COMMUNICATION_INTERFACES,
            projectId: projectId,
            componentId: componentId,
            componentName: component.name,
        };
        // Create point of attack for threats page
        createPointOfAttack(createdCommunicationInterface);

        // Create connection point as it still serves as the data infrastructure for the com interfaces
        dispatch(SystemActions.createConnectionPoint(createdCommunicationInterface));

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

    const handleDeleteCommunicationInterface = (componentId, interfaceId) => {
        const selectedComponent = components.filter((component) => component.id === componentId)[0];
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

    const selectComponent = (componentId) => {
        dispatch(EditorActions.selectComponent(componentId));
    };

    const deselectComponent = () => {
        dispatch(EditorActions.deselectComponent());
    };

    // Helper function to check if component is a standard system component or custom component
    const isSystemOrCustomComponent = (type) => {
        return ["CLIENT", "SERVER", "DATABASE"].includes(type) || typeof type === "number";
    };

    const selectConnector = (connector) => {
        // First connection, set the from, start connection preview
        if (newConnection === null) {
            dispatch(
                EditorActions.setConnection({
                    from: connector,
                })
            );
        } else if (
            connector.id != newConnection.from.id ||
            (connector.id == newConnection.from.id && connector.anchor != newConnection.from.anchor)
        ) {
            // Second connection, set the to, end connection preview, dispatch create connection
            batch(() => {
                const connectionId = nanoid();
                const connectionPointsIds = [];
                const from = newConnection.from;
                const to = connector;
                const fromComponent = components.filter((component) => component.id === from.id)[0];
                const toComponent = components.filter((component) => component.id === to.id)[0];

                // Check connection rules
                if (from.type === "USERS") {
                    if (!isSystemOrCustomComponent(to.type)) {
                        showErrorMessage({
                            message: t("errors.userConnectionInvalid"),
                        });
                        return;
                    }
                } else if (to.type === "USERS") {
                    if (!isSystemOrCustomComponent(from.type)) {
                        showErrorMessage({
                            message: t("errors.componentToUserInvalid"),
                        });
                        return;
                    }
                } else if (isSystemOrCustomComponent(from.type)) {
                    if (to.type !== "COMMUNICATION_INFRASTRUCTURE" || !from.communicationInterfaceId) {
                        showErrorMessage({
                            message: t("errors.componentToCommunicationInfraInvalid"),
                        });
                        return;
                    }
                } else if (from.type === "COMMUNICATION_INFRASTRUCTURE") {
                    if (!isSystemOrCustomComponent(to.type) || !to.communicationInterfaceId) {
                        showErrorMessage({
                            message: t("errors.communicationInfraToComponentInvalid"),
                        });
                        return;
                    }
                } else {
                    showErrorMessage({
                        message: t("errors.invalidConnection"),
                    });
                    return;
                }

                dispatch(
                    SystemActions.createConnection({
                        id: connectionId,
                        name: t("connection") + ": " + fromComponent.name + " -> " + toComponent.name,
                        from: from,
                        to: to,
                        connectionPoints: connectionPointsIds,
                        connectionPointsMeta: [],
                        waypoints: [],
                        recalculate: true,
                        projectId: projectId,
                        communicationInterfaceId: from.communicationInterfaceId,
                    })
                );

                dispatch(EditorActions.resetConnection());
            });
        }
    };

    const deselectConnector = () => {
        dispatch(EditorActions.deselectConnector());
    };

    const selectConnection = (data) => {
        dispatch(EditorActions.selectConnection(data));
    };

    const deselectConnection = () => {
        dispatch(EditorActions.deselectConnection());
    };

    const setLayerPosition = (x, y) => {
        dispatch(EditorActions.setLayerPosition({ x: x, y: y }));
    };

    const setStageScale = (newScale, newPos) => {
        dispatch(
            EditorActions.setStageScale({
                scale: newScale,
                position: newPos,
            })
        );
    };

    const setShowHelpLines = (show) => {
        dispatch(EditorActions.setShowHelpLines(show));
    };

    const addPointOfAttack = (component, type) => {
        const pointOfAttackId = nanoid();

        createPointOfAttack({
            id: pointOfAttackId,
            componentId: component.id,
            projectId,
            type,
        });
    };

    const removePointOfAttack = (pointOfAttack) => {
        dispatch(
            PointsOfAttackActions.removePointOfAttack({
                id: pointOfAttack.id,
            })
        );
    };

    const selectPointOfAttack = (pointOfAttackId) => {
        if (pointOfAttackId) {
            dispatch(EditorActions.selectPointOfAttack(pointOfAttackId));
        }
    };

    const deselectPointOfAttack = () => {
        dispatch(EditorActions.deselectPointOfAttack());
    };

    const addAssetToSelectedPointOfAttack = (asset) => {
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

    const removeAssetToSelectedPointOfAttack = (asset) => {
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

    const updateConnectionsOfComponent = () => {
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

    const connectionRecalculated = (connectionId, waypoints, connectionPointsMeta) => {
        dispatch(
            SystemActions.setConnection({
                id: connectionId,
                changes: {
                    waypoints: waypoints,
                    connectionPointsMeta: connectionPointsMeta,
                    recalculate: false,
                },
            })
        );
    };

    const standardComponents = useSelector(editorSelectors.selectStandardComponents);

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

    const selectConnectionPoint = (connectionId) => {
        dispatch(EditorActions.selectConnectionPoint(connectionId));
    };

    const deselectConnectionPoint = () => {
        dispatch(EditorActions.deselectConnectionPoint());
    };

    const setMousePointers = (data) => {
        const now = performance.now();
        const diff = now - lastMousePointerUpdate;
        if (diff > 0) {
            lastMousePointerUpdate = now;
        }
    };

    const addAssetToPointOfAttack = (asset, pointOfAttack) => {
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

    const removeAssetFromPointOfAttack = (asset, pointOfAttack) => {
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

    const setAssetSearchValue = (value) => {
        dispatch(EditorActions.setAssetSearchValue(value));
    };

    const loadComponentTypes = useCallback(() => {
        dispatch(EditorActions.getComponentTypes({ projectId }));
    }, [projectId, dispatch]);

    const createPointOfAttack = (data) => {
        dispatch(PointsOfAttackActions.createPointOfAttack(data));
    };

    const addComponentConnectionLine = (
        draggedComponentId,
        draggedComponentAnchor,
        otherComponentId,
        otherComponentAnchor
    ) => {
        const id = nanoid();

        dispatch(
            EditorActions.addComponentConnectionLine({
                id: id,
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

    const removeComponentConnectionLine = (componentConnectionLineId) => {
        dispatch(
            EditorActions.removeComponentConnectionLine({
                id: componentConnectionLineId,
            })
        );
    };

    const clearComponentConnectionLines = () => {
        dispatch(EditorActions.clearComponentConnectionLines());
    };

    useEffect(() => {}, [projectId]);

    const addInUseComponent = (componentId) => {
        dispatch(EditorActions.addInUseComponent(componentId));
    };

    const removeInUseComponent = (componentId) => {
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
