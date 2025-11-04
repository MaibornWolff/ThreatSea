/**
 * @module editor.page - Defines the editor
 *     page.
 */

import { CenterFocusWeak, Download } from "@mui/icons-material";
import { Box, IconButton, LinearProgress, Tooltip } from "@mui/material";
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Group, Layer, Line } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useAssets } from "../../application/hooks/use-assets.hook";
import { useEditor } from "../../application/hooks/use-editor.hook";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { ConnectionPreview } from "../components/editor-components/connection-preview.component";
import { EditorSidebar } from "../components/editor-components/editor-sidebar.component";
import { EditorStage } from "../components/editor-components/editor-stage.component";
import { Page } from "../components/page.component";
import { SystemComponentConnection } from "../components/editor-components/system-component-connection.component";
import { SystemComponent } from "../components/editor-components/system-component.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import ComponentDialogPage from "./component-dialog.page";
import { CommunicationContextMenu } from "../components/editor-components/editor-communication-interface-context-menu.component";
import { useAlert } from "../../application/hooks/use-alert.hook";
import CommunicationInterfaceDialog from "../dialogs/add-communication-interface.dialog";
import { LineDrawingProvider } from "../components/editor-components/contexts/LineDrawingProvider";

// Move these outside the component to avoid recreating on each render
const GRID_CONFIG = {
    speed: 1.5,
    gridSizeX: 5,
    gridSizeY: 5,
    renderedGridSizeX: 20,
    renderedGridSizeY: 20,
    gridLineColor: "#e5e8eb",
    helpLineColor: "#98a3b3",
};

// Memoize line array creation
const createLineArray = () => new Array(400).fill(0);

// Add variable for save timeout handle
let saveTimeoutHandle;
let lastLayerScreenshot;
let moveLayer = false;

const EditorPageBody = ({ updateAutoSaveOnCLick }) => {
    const projectId = parseInt(useParams().projectId);
    const stageRef = useRef();
    const componentLayerRef = useRef();
    const sidebarRef = useRef();
    const { openConfirm } = useConfirm();
    const { showErrorMessage } = useAlert();
    const location = useLocation();
    const navigate = useNavigate();
    const shouldCenter = location.state?.shouldCenter;
    const {
        autoSaveBlocked,
        moveComponent,
        selectComponent,
        removeComponent,
        loadSystem,
        systemPending,
        saveCurrentSystem,
        selectConnector,
        deselectConnector,
        selectConnection,
        deselectConnection,
        addComponent,
        deselectComponent,
        setLayerPosition,
        setShowHelpLines,
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
        addComponentConnectionLine,
        removeComponentConnectionLine,
        addInUseComponent,
        removeInUseComponent,
        setSelectedConnectionName,
        setAutoSaveStatus,
        components,
        connections,
        initialized,
        layerPosition,
        showHelpLines,
        selectedComponent,
        selectedComponentId,
        selectedConnection,
        selectedConnectionId,
        selectedPointOfAttack,
        selectedConnectionPointId,
        mousePointers,
        newConnection,
        pointsOfAttackOfSelectedComponent,
        assetSearchValue,
        blockAutoSave,
        componentConnectionLines,
        isAnyComponentInUse,
        selectedConnectionPoint,
        autoSaveStatus,
        makeScreenshot,
        handleChangeCommunicationInterfaceName,
        handleDeleteCommunicationInterface,
        addCommunicationInterface,
    } = useEditor({
        projectId,
        showErrorMessage,
    });
    const { t } = useTranslation("editorPage");

    const { loadAssets, items } = useAssets({
        projectId,
    });

    const dispatch = useDispatch();

    const userRole = useSelector((state) => state.projects.current?.role);
    const stageScale = useSelector((state) => state.editor.stageScale);
    const stagePosition = useSelector((state) => state.editor.stagePosition);

    const [communicationMenuOpen, setCommunicationMenuOpen] = useState(false);
    const [communicationMenuComponent, setCommunicationMenuComponent] = useState(null);
    const communicationMenuRef = useRef(null);
    const [isCommunicationInterfaceDialogOpen, setIsCommunicationInterfaceDialogOpen] = useState(false);

    // Memoize line array
    const lineArray = useMemo(() => createLineArray(), []);

    // Add ref to store current help lines position
    const currentHelpLinesRef = useRef(null);

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: true,
                showUniversalHeaderNavigation: true,
                showProjectInfo: true,
                getCatalogInfo: false,
            })
        );
    }, []);

    /**
     * Resets the current layer position and scale when open a project
     * and the editor view is rendered.
     */
    useEffect(() => {
        if (stageRef?.current && shouldCenter) {
            stageRef.current.scale({ x: 1, y: 1 });
            setLayerPosition(0, 0);
            setStageScale(1, { x: 0, y: 0 });
        }
        navigate(location.pathname, { replace: true, state: {} });
    }, [shouldCenter]);

    useEffect(() => {
        if (blockAutoSave) {
            resetSaveTimeout();
        }
    }, [blockAutoSave]);

    //run if unmounted
    useEffect(() => {
        return () => {
            if (saveTimeoutHandle) {
                clearTimeout(saveTimeoutHandle);
                saveTimeoutHandle = undefined;
            }

            save(true);
        };
    }, []);

    useEffect(() => {
        setTimeout(updateScreenshot, 100, true);
    }, [makeScreenshot, componentLayerRef.current]);

    const updateScreenshot = () => {
        if (componentLayerRef?.current) {
            const componentsOfProject = components.filter((component) => component.projectId === projectId);
            let minX = componentsOfProject.length === 0 ? 0 : 9999;
            let minY = componentsOfProject.length === 0 ? 0 : 9999;
            let maxX = componentsOfProject.length === 0 ? 0 : -9999;
            let maxY = componentsOfProject.length === 0 ? 0 : -9999;

            componentsOfProject.map((component) => {
                minX = Math.min(component.x, minX);
                minY = Math.min(component.y, minY);
                maxX = Math.max(component.x + component.width, maxX);
                maxY = Math.max(component.y + component.height, maxY);
            });

            const offsetX = 400;

            const diffX = Math.abs(maxX - minX);
            const diffY = Math.abs(maxY - minY);
            const factor = diffX / diffY;

            const width = (factor < 2.25 ? diffY * 2.25 : diffX) + offsetX;
            const height = Math.abs(maxY - minY) + offsetX;

            let posX = minX - offsetX / 2;
            let posY = minY - offsetX / 2;

            let stageScaleX = 1;
            let stageScaleY = 1;

            posX += layerPosition.x;
            posY += layerPosition.y;

            if (stageRef?.current) {
                const stage = stageRef.current;

                posX *= stage.scale().x;
                posY *= stage.scale().y;

                posX += stage.x();
                posY += stage.y();

                stageScaleX = stage.scale().x;
                stageScaleY = stage.scale().y;
            }

            const result = componentLayerRef.current.toDataURL({
                x: posX,
                y: posY,
                width: width * stageScaleX,
                height: height * stageScaleY,
            });

            if (result !== "data:,") {
                lastLayerScreenshot = result;
            }
        }
    };

    const save = (forceSave = false) => {
        if (shouldSave(forceSave)) {
            if (componentLayerRef?.current || lastLayerScreenshot) {
                saveCurrentSystem({ image: lastLayerScreenshot });
            }
        }
    };

    function shouldSave(forceSave) {
        // User with Viewer role should not trigger autosave
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            return (
                (!systemPending && initialized && !isAnyComponentInUse && autoSaveStatus !== "saving") ||
                forceSave === true
            );
        } else {
            return false;
        }
    }

    useEffect(() => {
        setAutoSaveStatus("saving");
        updateAutoSaveOnCLick(() => save(true));
        return () => {
            updateAutoSaveOnCLick(undefined);
        };
    }, []);

    const resetSaveTimeout = () => {
        if (saveTimeoutHandle) {
            clearTimeout(saveTimeoutHandle);
        }
        saveTimeoutHandle = setTimeout(save, 1000);
        autoSaveBlocked();
    };

    const handlComponentDragStart = ({ evt }, componentId) => {
        addInUseComponent(componentId);
        selectComponent(componentId);
        deselectConnection();
        deselectPointOfAttack();
        closeSideBar();

        setMousePointers({
            x: -20000,
            y: -20000,
        });

        const theConnectionsOfTheComponent = connections.filter(
            (connection) => connection.from.id === componentId || connection.to.id === componentId
        );

        theConnectionsOfTheComponent.forEach((connection) => {
            setConnectionVisibility(connection.id, false);

            const draggedComponent = connection.from.id === componentId ? connection.from : connection.to;
            const otherComponent = connection.from.id === componentId ? connection.to : connection.from;

            addComponentConnectionLine(
                draggedComponent.component.id,
                draggedComponent.anchor,
                otherComponent.component.id,
                otherComponent.anchor
            );
        });
    };

    const handlComponentDragEnd = (event, componentId) => {
        removeInUseComponent(componentId);
        setShowHelpLines(false);
        updateConnectionsOfComponent();
        deselectComponent();

        setMousePointers({
            x: event.evt.x,
            y: event.evt.y,
        });

        const theConnectionsOfTheComponent = connections.filter(
            (connection) => connection.from.id === componentId || connection.to.id === componentId
        );

        const componentConnectionLinesOfTheComponent = componentConnectionLines.filter(
            (line) => line.draggedComponentInfo.id === componentId || line.otherComponentInfo.id === componentId
        );

        componentConnectionLinesOfTheComponent.forEach((line) => {
            removeComponentConnectionLine(line.id);
        });

        theConnectionsOfTheComponent.forEach((connection) => {
            setConnectionVisibility(connection.id, true);
        });
    };

    const handleComponentDragMove = useCallback(
        (event, componentId) => {
            moveLayer = false;

            const gridPositionX = Math.floor(event.target.position().x / GRID_CONFIG.gridSizeX);
            const gridPositionY = Math.floor(event.target.position().y / GRID_CONFIG.gridSizeY);

            const newx = gridPositionX * GRID_CONFIG.gridSizeX;
            const newy = gridPositionY * GRID_CONFIG.gridSizeY;

            event.target.setPosition({ x: newx, y: newy });

            // Update ref directly instead of using state
            currentHelpLinesRef.current = {
                x: newx + 9 + layerPosition.x,
                x2: newx + 71 + layerPosition.x,
                y: newy + 9 + layerPosition.y,
                y2: newy + 71 + layerPosition.y,
            };

            setShowHelpLines(true);
            moveComponent({
                id: componentId,
                x: newx,
                y: newy,
                gridX: gridPositionX,
                gridY: gridPositionY,
                helpLines: currentHelpLinesRef.current,
            });
        },
        [layerPosition, moveComponent]
    );

    const handleSelectComponent = ({ evt }, componentId) => {
        if (!evt.defaultPrevented && evt.button === 0) {
            evt.preventDefault();

            if (communicationMenuOpen) {
                handleCloseCommunicationMenu();
                return;
            }

            setAssetSearchValue("");
            selectComponent(componentId);
            deselectConnection();
            deselectPointOfAttack();
            deselectConnectionPoint();
            showSideBar();
        }
    };

    const handleSelectConnection = ({ evt }, id) => {
        if (!evt.defaultPrevented && evt.button === 0) {
            evt.preventDefault();

            deselectPointOfAttack();
            selectConnection(id);
            deselectComponent();
            deselectConnectionPoint();
            showSideBar();
        }
    };

    const handleSelectAnchor = (e, data) => {
        if (e.evt) e = e.evt;
        if (data.communicationInterfaceType) {
            e.preventDefault();
            selectConnector(data);
        } else {
            if (e.button === 0) {
                e.preventDefault();
                selectConnector(data);
            }
        }
    };

    const handleClickStage = ({ evt }) => {
        if (!evt.defaultPrevented) {
            if (communicationMenuOpen) {
                handleCloseCommunicationMenu();
                return;
            }
            deselectComponent();
            closeSideBar();
            deselectConnection();
            deselectPointOfAttack();
            deselectConnectionPoint();
            deselectConnector();
        }
    };

    const getConnectedComponents = useCallback(
        (componentId) => {
            return connections
                .filter((connection) => connection.from.id === componentId || connection.to.id === componentId)
                .map((connection) => {
                    return connection.from.id === componentId ? connection.to : connection.from;
                });
        },
        [connections]
    );

    const closeSideBar = () => {
        if (sidebarRef && sidebarRef.current) {
            sidebarRef.current.style.right = "-600px";
        }
    };

    const showSideBar = () => {
        if (sidebarRef && sidebarRef.current) {
            sidebarRef.current.style.right = 40 + "px";
        }
    };

    const handleMouseDown = (event) => {
        const { evt, target } = event;
        if (evt.button === 0 && target.nodeType === "Stage") {
            event.cancelBubble = true;
            evt.preventDefault();
            evt.stopImmediatePropagation();
            moveLayer = true;
            stageRef.current.content.style.cursor = "move";
        }
    };

    const handleMouseMove = ({ evt }) => {
        const { layerX: x, layerY: y } = evt;
        setMousePointers({
            x: x,
            y: y,
        });
        if (moveLayer) {
            setLayerPosition(
                layerPosition.x + evt.movementX * (GRID_CONFIG.speed / stageRef.current.scaleX()),
                layerPosition.y + evt.movementY * (GRID_CONFIG.speed / stageRef.current.scaleY())
            );
        }
    };

    const handleMouseOut = () => {
        setMousePointers({
            x: -20000,
            y: -20000,
        });
    };

    const handleTouchMove = ({ evt }) => {
        setLayerPosition(
            layerPosition.x + evt.movementX * (GRID_CONFIG.speed / stageRef.current.scaleX()),
            layerPosition.y + evt.movementY * (GRID_CONFIG.speed / stageRef.current.scaleY())
        );
    };

    const handleMouseUp = ({ evt }) => {
        if (evt.button === 0 && moveLayer) {
            moveLayer = false;
            stageRef.current.content.style.cursor = "default";
            evt.preventDefault();
            evt.stopPropagation();
        }
    };

    const handleContextMenuAction = (componentType) => {
        const { x, y } = stageRef.current.getRelativePointerPosition();

        const gridPositionX = Math.floor((x - layerPosition.x) / GRID_CONFIG.gridSizeX);
        const gridPositionY = Math.floor((y - layerPosition.y) / GRID_CONFIG.gridSizeY);

        addComponent({
            x: gridPositionX * GRID_CONFIG.gridSizeX,
            y: gridPositionY * GRID_CONFIG.gridSizeY,
            gridX: gridPositionX,
            gridY: gridPositionY,
            componentType,
        });
    };

    const handleContextMenuOpen = () => {
        deselectComponent();
        closeSideBar();
        deselectConnection();
        deselectPointOfAttack();
        deselectConnectionPoint();
        deselectConnector();
    };

    const handleDeleteComponent = () => {
        if (selectedComponent !== undefined && selectedComponent !== null && selectedPointOfAttack === undefined) {
            openConfirm({
                state: components,
                message: t("deleteDialog.deleteCompMessage", {
                    componentName: selectedComponent.name,
                }),
                acceptText: t("deleteDialog.delete"),
                cancelText: t("deleteDialog.cancel"),
                onAccept: () => {
                    removeComponent();
                    closeSideBar();
                },
            });
        }
    };

    const handleDeleteConnection = () => {
        if (selectedConnectionId !== undefined && selectedConnectionId !== null) {
            openConfirm({
                state: components,
                message: t("deleteDialog.deleteConnMessage", {
                    connectionName: selectedConnection.name,
                }),
                acceptText: t("deleteDialog.delete"),
                cancelText: t("deleteDialog.cancel"),
                onAccept: () => {
                    removeConnection();
                    closeSideBar();
                },
            });
        }
    };

    const handleDeleteConnectionBetweenComponents = (componentId1, componentId2) => {
        const connection = connections.find(
            (conn) =>
                (conn.from.id === componentId1 && conn.to.id === componentId2) ||
                (conn.from.id === componentId2 && conn.to.id === componentId1)
        );

        if (connection) {
            openConfirm({
                state: components,
                message: t("deleteDialog.deleteConnMessage", {
                    connectionName: connection.name,
                }),
                acceptText: t("deleteDialog.delete"),
                cancelText: t("deleteDialog.cancel"),
                onAccept: () => {
                    removeConnectionById(connection.id);
                },
            });
        }
    };

    const handleDeleteCommunicationInterfaceDialog = (
        componentId,
        interfaceId,
        interfaceName,
        doCloseSidebar = false
    ) => {
        if (componentId && interfaceId) {
            openConfirm({
                state: components,
                message: t("deleteDialog.deleteInterfaceMessage", {
                    interfaceName: interfaceName,
                }),
                acceptText: t("deleteDialog.delete"),
                cancelText: t("deleteDialog.cancel"),
                onAccept: () => {
                    handleDeleteCommunicationInterface(componentId, interfaceId);
                    if (doCloseSidebar) {
                        closeSideBar();
                    }
                },
            });
        }
    };

    const handleOnNameChange = (evt) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) setSelectedComponentName(evt.target.value);
    };

    const handleOnDescriptionChange = (evt) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) setSelectedComponentDescription(evt.target.value);
    };

    const handleOnConnectionPointDescriptionChange = (evt) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) setSelectedConnectionPointDescription(evt.target.value);
    };

    const handleConnectionNameChange = (evt) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) setSelectedConnectionName(evt.target.value);
    };

    const handleOnConnectionPointClicked = ({ evt }, connectionPointId) => {
        evt.preventDefault();

        if (evt.button === 0) {
            selectConnectionPoint(connectionPointId);
            deselectComponent();
            deselectConnection();
            showSideBar();
        }
    };

    const handleOnPointOfAttackClicked = ({ evt }, pointOfAttackId, componentId) => {
        evt.preventDefault();

        if (evt.button === 0) {
            setAssetSearchValue("");
            selectPointOfAttack(pointOfAttackId);
            if (componentId) {
                deselectConnection();
                deselectConnectionPoint();
                selectComponent(componentId);
                showSideBar();
            }
        }
    };

    const handleChangePointOfAttack = (e, type, pointOfAttack) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            if (e.target.checked) {
                addPointOfAttack(selectedComponent, type);
            } else {
                openConfirm({
                    state: components,
                    message: t("deleteDialog.deleteAttPointMessage", {
                        attPointName: t("pointsOfAttackList." + pointOfAttack.type),
                    }),
                    acceptText: t("deleteDialog.delete"),
                    cancelText: t("deleteDialog.cancel"),
                    onAccept: () => {
                        removePointOfAttack(pointOfAttack);
                    },
                });
            }
        }
    };

    const handleOnAssetChanged = (e, asset) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR) && selectedPointOfAttack !== null) {
            if (e.target.checked) {
                addAssetToSelectedPointOfAttack(asset);
            } else {
                removeAssetToSelectedPointOfAttack(asset);
            }
        }
    };

    const handleAddAssetToAllPointsOfAttack = (e, asset) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR) && selectedComponent !== null) {
            pointsOfAttackOfSelectedComponent.forEach((pointOfAttack) => {
                addAssetToPointOfAttack(asset, pointOfAttack);
            });
        }
    };

    const handleRemoveAssetFromAllPointsOfAttack = (e, asset) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR) && selectedComponent !== null) {
            pointsOfAttackOfSelectedComponent.forEach((pointOfAttack) => {
                removeAssetFromPointOfAttack(asset, pointOfAttack);
            });
        }
    };

    const handleKeyUp = ({ key }) => {
        if (key === "Delete") {
            handleDeleteComponent();
            handleDeleteConnection();
        }
    };

    const onRecalculated = (connectionId, waypoints, connectionPointsMeta) => {
        connectionRecalculated(connectionId, waypoints, connectionPointsMeta);
    };

    const handleAssetSearchChanged = (e) => {
        setAssetSearchValue(e.target.value);
    };

    const onStageScale = (newScale, newPos) => {
        setStageScale(newScale, newPos);
    };

    const handleDownloadSystemView = () => {
        updateScreenshot();
        let link = document.createElement("a");
        link.href = lastLayerScreenshot;
        link.download = "systemView.png";
        link.click();
    };

    const handleCenterEditor = () => {
        let minX = 9999;
        let minY = 9999;
        let maxX = -9999;
        let maxY = -9999;
        const componentsOfProject = components.filter((component) => component.projectId === projectId);

        if (componentsOfProject.length === 0) {
            setLayerPosition(0, 0);
            return;
        }

        componentsOfProject.map((component) => {
            minX = Math.min(component.x, minX);
            minY = Math.min(component.y, minY);
            maxX = Math.max(component.x + component.width, maxX);
            maxY = Math.max(component.y + component.height, maxY);
        });

        if (stageRef?.current) {
            const stage = stageRef.current;
            const diffX = Math.abs(maxX - minX);
            const diffY = Math.abs(maxY - minY);

            if (diffX > stage.width() / stage.scale().x) {
                let newScale = (stage.width() - 100) / diffX;
                newScale = Math.min(5, Math.max(newScale, 0.5));
                stage.scale({ x: newScale, y: newScale });
            }

            if (diffY > stage.height() / stage.scale().y) {
                let newScale = (stage.height() - 100) / diffY;
                newScale = Math.min(5, Math.max(newScale, 0.5));
                stage.scale({ x: newScale, y: newScale });
            }

            let layerX = minX;
            let layerY = minY;

            layerX += stage.x() / stage.scale().x;
            layerY += stage.y() / stage.scale().y;

            layerX -= stage.width() / 2 / stage.scale().x;
            layerY -= stage.height() / 2 / stage.scale().x;

            layerX += diffX / 2;
            layerY += diffY / 2;

            setLayerPosition(-layerX, -layerY);
        }
    };

    const openCommunicationInterfacesMenu = (component) => {
        setCommunicationMenuComponent(component);
        setCommunicationMenuOpen(true);
    };

    const handleCommunicationSelect = (communicationInterfaceId) => {
        const communicationInterface = communicationMenuComponent.communicationInterfaces.find(
            (c) => c.id === communicationInterfaceId
        );
        if (!communicationInterface) {
            showErrorMessage({
                message: t("errors.noCommunicationInterfaceFound"),
            });
            return;
        }

        // Create a synthetic event object for connection point
        const connectionPointEvent = {
            evt: {
                preventDefault: () => {},
                button: 0, // Simulating left click
                stopPropagation: () => {},
            },
            target: {
                getStage: () => stageRef.current,
            },
        };

        // Create a synthetic event object for point of attack
        const pointOfAttackEvent = {
            evt: {
                preventDefault: () => {},
                button: 0, // Simulating left click
                stopPropagation: () => {},
            },
        };

        // Call the handlers with the synthetic events and data
        handleOnConnectionPointClicked(connectionPointEvent, communicationInterfaceId);
        handleOnPointOfAttackClicked(pointOfAttackEvent, communicationInterfaceId);

        setCommunicationMenuOpen(false);
    };

    const handleCloseCommunicationMenu = () => {
        setCommunicationMenuOpen(false);
    };

    const handleOpenCommunicationInterfaceDialog = () => {
        setIsCommunicationInterfaceDialogOpen(true);
    };

    const handleCreateNewCommunicationInterface = ({ name, icon }) => {
        addCommunicationInterface(communicationMenuComponent.id, name, icon);
        setIsCommunicationInterfaceDialogOpen(false);
    };

    const handleCloseCommunicationInterfaceDialog = () => {
        setIsCommunicationInterfaceDialogOpen(false);
    };

    // Memoize grid rendering calculations
    const gridRenderConfig = useMemo(() => {
        let stageOffsetX = 0;
        let stageOffsetY = 0;
        if (stageRef?.current) {
            stageOffsetX = stageRef.current.x() / stageRef.current.scale().x;
            stageOffsetY = stageRef.current.y() / stageRef.current.scale().y;
        }

        const columnsToTheTop = Math.floor(layerPosition.y / GRID_CONFIG.renderedGridSizeY) + 75;
        const offsetY = columnsToTheTop * GRID_CONFIG.renderedGridSizeY;
        const columnsToTheLeft = Math.floor(layerPosition.x / GRID_CONFIG.renderedGridSizeX) + 75;
        const offsetX = columnsToTheLeft * GRID_CONFIG.renderedGridSizeX;

        return {
            stageOffsetX,
            stageOffsetY,
            offsetX,
            offsetY,
        };
    }, [layerPosition, stageRef?.current]);

    useEffect(() => {
        loadSystem();
    }, [loadSystem, projectId]);

    useEffect(() => {
        loadComponentTypes();
    }, [loadComponentTypes, projectId]);

    useEffect(() => {
        loadAssets({
            projectId,
        });
    }, [projectId, loadAssets]);

    useEffect(() => {}, [communicationMenuOpen]);

    if (!initialized) {
        return <LinearProgress />;
    }

    return (
        <React.Fragment>
            <LineDrawingProvider>
                <Page
                    sx={{
                        p: 0,
                        paddingLeft: 0,
                        paddingRight: 0,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            bgcolor: "background.paper",
                            boxShadow: 8,
                            height: "100%",
                            position: "realtive",
                        }}
                    >
                        <EditorStage
                            ref={stageRef}
                            onClick={handleClickStage}
                            handleMouseDown={handleMouseDown}
                            handleMouseMove={handleMouseMove}
                            handleTouchMove={handleTouchMove}
                            handleMouseUp={handleMouseUp}
                            onContextMenuOpen={handleContextMenuOpen}
                            onContextMenuAction={handleContextMenuAction}
                            onMouseLeave={handleMouseOut}
                            onKeyUp={handleKeyUp}
                            layerPosition={layerPosition}
                            mousePointers={mousePointers}
                            onScale={onStageScale}
                            scale={stageScale}
                            position={stagePosition}
                            userRole={userRole}
                        >
                            <Layer>
                                {lineArray.map((item, index) => (
                                    <Line
                                        key={index}
                                        points={[
                                            layerPosition.x - gridRenderConfig.offsetX - gridRenderConfig.stageOffsetX,
                                            layerPosition.y -
                                                gridRenderConfig.offsetY +
                                                index * GRID_CONFIG.renderedGridSizeY -
                                                gridRenderConfig.stageOffsetY,
                                            500000,
                                            layerPosition.y -
                                                gridRenderConfig.offsetY +
                                                index * GRID_CONFIG.renderedGridSizeY -
                                                gridRenderConfig.stageOffsetY,
                                        ]}
                                        stroke={GRID_CONFIG.gridLineColor}
                                        strokeWidth={0.75}
                                    />
                                ))}

                                {lineArray.map((item, index) => {
                                    let stageOffsetX = 0;
                                    let stageOffsetY = 0;
                                    if (stageRef?.current) {
                                        stageOffsetX = stageRef.current.x() / stageRef.current.scale().x;
                                        stageOffsetY = stageRef.current.y() / stageRef.current.scale().y;
                                    }
                                    const columnsToTheTop =
                                        Math.floor(layerPosition.y / GRID_CONFIG.renderedGridSizeY) + 75;
                                    const offsetY = columnsToTheTop * GRID_CONFIG.renderedGridSizeY;
                                    const columnsToTheLeft =
                                        Math.floor(layerPosition.x / GRID_CONFIG.renderedGridSizeX) + 75;
                                    const offsetX = columnsToTheLeft * GRID_CONFIG.renderedGridSizeX;
                                    return (
                                        <Line
                                            key={index}
                                            points={[
                                                layerPosition.x -
                                                    offsetX +
                                                    index * GRID_CONFIG.renderedGridSizeX -
                                                    stageOffsetX,
                                                layerPosition.y - offsetY - stageOffsetY,
                                                layerPosition.x -
                                                    offsetX +
                                                    index * GRID_CONFIG.renderedGridSizeX -
                                                    stageOffsetX,
                                                500000,
                                            ]}
                                            stroke={GRID_CONFIG.gridLineColor}
                                            strokeWidth={0.75}
                                        />
                                    );
                                })}

                                {showHelpLines && currentHelpLinesRef.current && (
                                    <Group>
                                        <Line
                                            points={[
                                                -1000,
                                                currentHelpLinesRef.current.y,
                                                10000,
                                                currentHelpLinesRef.current.y,
                                            ]}
                                            stroke={GRID_CONFIG.helpLineColor}
                                            strokeWidth={0.75}
                                        />
                                        <Line
                                            points={[
                                                -1000,
                                                currentHelpLinesRef.current.y2,
                                                10000,
                                                currentHelpLinesRef.current.y2,
                                            ]}
                                            stroke={GRID_CONFIG.helpLineColor}
                                            strokeWidth={0.75}
                                        />
                                        <Line
                                            points={[
                                                currentHelpLinesRef.current.x,
                                                -1000,
                                                currentHelpLinesRef.current.x,
                                                10000,
                                            ]}
                                            stroke={GRID_CONFIG.helpLineColor}
                                            strokeWidth={0.75}
                                        />
                                        <Line
                                            points={[
                                                currentHelpLinesRef.current.x2,
                                                -1000,
                                                currentHelpLinesRef.current.x2,
                                                10000,
                                            ]}
                                            stroke={GRID_CONFIG.helpLineColor}
                                            strokeWidth={0.75}
                                        />
                                    </Group>
                                )}
                            </Layer>

                            <Layer x={layerPosition.x} y={layerPosition.y}>
                                {newConnection && (
                                    <ConnectionPreview
                                        key={`new-connection-${newConnection.from.id}-${Date.now()}`}
                                        layerPosition={layerPosition}
                                        component={
                                            components.filter((component) => component.id === newConnection.from.id)[0]
                                        }
                                        stageRef={stageRef}
                                    />
                                )}

                                {componentConnectionLines.map((line, index) => {
                                    const key = `connection-preview-${line.otherComponentInfo.id}-${line.draggedComponentInfo.id}-${index}`;
                                    return (
                                        <ConnectionPreview
                                            key={key}
                                            layerPosition={layerPosition}
                                            component={
                                                components.filter(
                                                    (component) => component.id === line.otherComponentInfo.id
                                                )[0]
                                            }
                                            draggedComponent={
                                                components.filter(
                                                    (component) => component.id === line.draggedComponentInfo.id
                                                )[0]
                                            }
                                            stageRef={stageRef}
                                        />
                                    );
                                })}
                            </Layer>

                            <Layer x={layerPosition.x} y={layerPosition.y} ref={componentLayerRef}>
                                {connections.map((connection, i) => {
                                    if (connection.visible === false) {
                                        return <Group key={i}></Group>;
                                    }

                                    return (
                                        <SystemComponentConnection
                                            key={i}
                                            {...connection}
                                            onClick={handleSelectConnection}
                                            onPointOfAttackClicked={handleOnPointOfAttackClicked}
                                            fromComponent={
                                                components.filter((component) => component.id === connection.from.id)[0]
                                            }
                                            toComponent={
                                                components.filter((component) => component.id === connection.to.id)[0]
                                            }
                                            components={components}
                                            selected={selectedConnectionId === connection.id}
                                            recalculate={connection.recalculate}
                                            onRecalculated={onRecalculated}
                                            onConnectionPointClicked={handleOnConnectionPointClicked}
                                            selectedConnectionPointId={selectedConnectionPointId}
                                            stageRef={stageRef}
                                        />
                                    );
                                })}
                                {components.map((component, i) => (
                                    <SystemComponent
                                        key={i}
                                        {...component}
                                        onSelectAnchor={handleSelectAnchor}
                                        selectedAnchor={
                                            newConnection
                                                ? newConnection.from.id === component.id
                                                    ? newConnection.from.anchor
                                                    : ""
                                                : ""
                                        }
                                        onDragMove={(e) => handleComponentDragMove(e, component.id)}
                                        onClick={(e) => handleSelectComponent(e, component.id)}
                                        onDragEnd={(e) => handlComponentDragEnd(e, component.id)}
                                        onDragStart={(e) => handlComponentDragStart(e, component.id)}
                                        onPointOfAttackClicked={handleOnPointOfAttackClicked}
                                        selectedPointOfAttackId={selectedPointOfAttack ? selectedPointOfAttack.id : ""}
                                        component={component}
                                        stageRef={stageRef}
                                        userRole={userRole}
                                        openCommunicationInterfacesMenu={openCommunicationInterfacesMenu}
                                    />
                                ))}
                            </Layer>
                        </EditorStage>

                        <Box
                            sx={{
                                position: "absolute",
                                top: 8,
                                left: 8,
                                width: "38px",
                                marginLeft: "auto",
                                marginRight: "auto",
                            }}
                        >
                            <IconButton
                                onClick={handleCenterEditor}
                                sx={{
                                    backgroundColor: "background.paperIntransparent",
                                    "&:hover": {
                                        backgroundColor: "rgba(149, 163, 181, 0.7)",
                                    },
                                }}
                            >
                                <CenterFocusWeak sx={{ fontSize: 30, color: "primary.main" }} />
                            </IconButton>
                        </Box>
                        <Box
                            sx={{
                                position: "absolute",
                                top: 60,
                                left: 8,
                                width: "38px",
                                marginLeft: "auto",
                                marginRight: "auto",
                            }}
                        >
                            <Tooltip title={t("canvas.exportSystemImage")}>
                                <IconButton
                                    onClick={handleDownloadSystemView}
                                    sx={{
                                        backgroundColor: "background.paperIntransparent",
                                        "&:hover": {
                                            backgroundColor: "rgba(149, 163, 181, 0.7)",
                                        },
                                    }}
                                >
                                    <Download
                                        sx={{
                                            fontSize: 30,
                                            color: "primary.main",
                                        }}
                                    />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    <EditorSidebar
                        sidebarRef={sidebarRef}
                        selectedComponent={selectedComponent}
                        selectedComponentId={selectedComponentId}
                        selectedPointOfAttack={selectedPointOfAttack}
                        handleDeleteComponent={handleDeleteComponent}
                        handleOnNameChange={handleOnNameChange}
                        handleChangePointOfAttack={handleChangePointOfAttack}
                        handleAddAssetToAllPointsOfAttack={handleAddAssetToAllPointsOfAttack}
                        handleRemoveAssetFromAllPointsOfAttack={handleRemoveAssetFromAllPointsOfAttack}
                        assetSearchValue={assetSearchValue}
                        handleAssetSearchChanged={handleAssetSearchChanged}
                        items={items}
                        pointsOfAttackOfSelectedComponent={pointsOfAttackOfSelectedComponent}
                        selectedConnectionId={selectedConnectionId}
                        selectedConnection={selectedConnection}
                        handleDeleteConnection={handleDeleteConnection}
                        handleOnConnectionNameChange={handleConnectionNameChange}
                        handleOnAssetChanged={handleOnAssetChanged}
                        selectedConnectionPoint={selectedConnectionPoint}
                        userRole={userRole}
                        handleOnDescriptionChange={handleOnDescriptionChange}
                        connectedComponents={getConnectedComponents(selectedComponentId)}
                        handleDeleteConnectionBetweenComponents={handleDeleteConnectionBetweenComponents}
                        handleOnConnectionPointDescriptionChange={handleOnConnectionPointDescriptionChange}
                        handleChangeCommunicationInterfaceName={handleChangeCommunicationInterfaceName}
                        handleDeleteCommunicationInterface={handleDeleteCommunicationInterfaceDialog}
                    />

                    <Routes>
                        <Route path="components/edit" element={<ComponentDialogPage />} />
                    </Routes>

                    <CommunicationContextMenu
                        ref={communicationMenuRef}
                        stageRef={stageRef}
                        open={communicationMenuOpen}
                        componentName={communicationMenuComponent?.name}
                        onSelect={handleCommunicationSelect}
                        onCreateNew={handleOpenCommunicationInterfaceDialog}
                        onClose={handleCloseCommunicationMenu}
                        onSelectAnchor={handleSelectAnchor}
                        componentId={communicationMenuComponent?.id}
                        componentType={communicationMenuComponent?.type}
                        components={components}
                        connections={connections}
                        handleDeleteConnectionBetweenComponents={handleDeleteConnectionBetweenComponents}
                    />
                    {isCommunicationInterfaceDialogOpen && (
                        <CommunicationInterfaceDialog
                            onClose={handleCloseCommunicationInterfaceDialog}
                            handleCreateNew={handleCreateNewCommunicationInterface}
                        />
                    )}
                </Page>
            </LineDrawingProvider>
        </React.Fragment>
    );
};

export const EditorPage = memo(CreatePage(HeaderNavigation, EditorPageBody, true));
