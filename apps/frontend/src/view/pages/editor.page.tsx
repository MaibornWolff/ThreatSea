/**
 * @module editor.page - Defines the editor
 *     page.
 */

import { CenterFocusWeak, Download } from "@mui/icons-material";
import { Box, IconButton, LinearProgress, Tooltip } from "@mui/material";
import {
    memo,
    useCallback,
    useEffect,
    useEffectEvent,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { Group, Layer, Line } from "react-konva";
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { EditorActions } from "../../application/actions/editor.actions";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useAssets } from "../../application/hooks/use-assets.hook";
import { useAutoSavePreview } from "../../application/hooks/use-auto-save-preview.hook";
import { useEditor, type EditorConnectionAnchor } from "../../application/hooks/use-editor.hook";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { ConnectionPreview } from "../components/editor-components/connection-preview.component";
import { EditorSidebar } from "../components/editor-components/editor-sidebar.component";
import { EditorStage } from "../components/editor-components/editor-stage.component";
import { Page } from "../components/page.component";
import { SystemComponentConnection } from "../components/editor-components/system-component-connection.component";
import { SystemComponent } from "../components/editor-components/system-component.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import AssetDialogPage from "./asset-dialog.page";
import ComponentDialogPage from "./component-dialog.page";
import { CommunicationContextMenu } from "../components/editor-components/editor-communication-interface-context-menu.component";
import { useAlert } from "../../application/hooks/use-alert.hook";
import CommunicationInterfaceDialog from "../dialogs/add-communication-interface.dialog";
import { LineDrawingProvider } from "../components/editor-components/contexts/LineDrawingProvider";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import type { Asset } from "#api/types/asset.types.ts";
import type {
    AugmentedSystemComponent,
    ConnectionEndpointWithComponent,
    Coordinate,
    SystemPointOfAttack,
    ConnectionPointMeta,
} from "#api/types/system.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";

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
const createLineArray = (): number[] => new Array(400).fill(0);

interface HelpLines {
    x: number;
    y: number;
    x2: number;
    y2: number;
}

interface EditorPageBodyProps {
    updateAutoSaveOnClick?: (handler: (() => void) | undefined) => void;
}

const EditorPageBody = ({ updateAutoSaveOnClick }: EditorPageBodyProps) => {
    const { projectId: projectIdParam } = useParams<{ projectId: string }>();
    const projectId = Number.parseInt(projectIdParam ?? "", 10);
    const stageRef = useRef<KonvaStage | null>(null);
    const [newConnectionMousePosition, setNewConnectionMousePosition] = useState<Coordinate | null>(null);
    const componentLayerRef = useRef<KonvaLayer | null>(null);
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const moveLayerRef = useRef(false);
    const { openConfirm } = useConfirm();
    const { showErrorMessage } = useAlert();
    const location = useLocation();
    const navigate = useNavigate();
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

    const dispatch = useAppDispatch();

    const userRole = useAppSelector((state) => state.projects.current?.role);
    const stageScale = useAppSelector((state) => state.editor.stageScale);
    const stagePosition = useAppSelector((state) => state.editor.stagePosition);
    const lastCenteredProjectId = useAppSelector((state) => state.editor.lastCenteredProjectId);
    const loadedProjectId = useAppSelector((state) => state.system.loadedProjectId);

    const { downloadSystemView } = useAutoSavePreview({
        componentLayerRef,
        updateAutoSaveOnClick,
        saveCurrentSystem,
        autoSaveBlocked,
        setAutoSaveStatus,
        userRole,
        systemPending,
        initialized,
        isAnyComponentInUse,
        autoSaveStatus,
        blockAutoSave,
        makeScreenshot,
    });

    type ConnectorSelection = EditorConnectionAnchor & {
        communicationInterfaceType?: string | null;
    };

    const [communicationMenuOpen, setCommunicationMenuOpen] = useState(false);
    const [communicationMenuComponent, setCommunicationMenuComponent] = useState<AugmentedSystemComponent | null>(null);
    const [isCommunicationInterfaceDialogOpen, setIsCommunicationInterfaceDialogOpen] = useState(false);

    // Memoize line array
    const lineArray = useMemo(() => createLineArray(), []);

    // Add ref to store current help lines position
    const currentHelpLinesRef = useRef<HelpLines | null>(null);

    const newConnectionPreviewComponent = useMemo(() => {
        if (!newConnection) {
            return undefined;
        }
        return components.filter((component) => component.id === newConnection.from.id)[0];
    }, [components, newConnection]);

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
    }, [dispatch]);

    // Fit-to-view on first mount per project. Waits for the new project's data
    // to land before measuring; skips on tab switch to preserve user's pan.
    useEffect(() => {
        if (loadedProjectId !== projectId) {
            return;
        }
        if (lastCenteredProjectId === projectId) {
            return;
        }

        const raf = requestAnimationFrame(() => {
            if (!stageRef.current || !componentLayerRef.current) {
                return;
            }
            centerOnComponentsEvent();
            dispatch(EditorActions.setLastCenteredProjectId(projectId));
            if (location.state) {
                navigate(location.pathname, { replace: true, state: {} });
            }
        });
        return () => cancelAnimationFrame(raf);
    }, [loadedProjectId, projectId, lastCenteredProjectId, dispatch, navigate, location.pathname, location.state]);

    const handleComponentDragStart = (_event: KonvaEventObject<DragEvent>, componentId: string): void => {
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

            if (draggedComponent.component && otherComponent.component) {
                addComponentConnectionLine(
                    draggedComponent.component.id,
                    draggedComponent.anchor,
                    otherComponent.component.id,
                    otherComponent.anchor
                );
            }
        });
    };

    const handleComponentDragEnd = (event: KonvaEventObject<DragEvent>, componentId: string): void => {
        removeInUseComponent(componentId);
        setShowHelpLines(false);
        updateConnectionsOfComponent();
        deselectComponent();

        // event.evt is undefined when Konva fires dragend programmatically during unmount.
        if (event.evt) {
            setMousePointers({
                x: event.evt.x,
                y: event.evt.y,
            });
        }

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

    const handleComponentDragMove = (event: KonvaEventObject<DragEvent>, componentId: string): void => {
        moveLayerRef.current = false;

        const gridPositionX = Math.floor(event.target.position().x / GRID_CONFIG.gridSizeX);
        const gridPositionY = Math.floor(event.target.position().y / GRID_CONFIG.gridSizeY);

        const newx = gridPositionX * GRID_CONFIG.gridSizeX;
        const newy = gridPositionY * GRID_CONFIG.gridSizeY;

        event.target.setPosition({ x: newx, y: newy });

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
        });
    };

    const handleSelectComponent = ({ evt }: KonvaEventObject<MouseEvent>, componentId: string): void => {
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

    const handleSelectConnection = ({ evt }: KonvaEventObject<MouseEvent>, id: string): void => {
        if (!evt.defaultPrevented && evt.button === 0) {
            evt.preventDefault();

            deselectPointOfAttack();
            selectConnection(id);
            deselectComponent();
            deselectConnectionPoint();
            showSideBar();
        }
    };

    const handleSelectAnchor = (e: MouseEvent | KonvaEventObject<MouseEvent>, data: ConnectorSelection): void => {
        const event = "evt" in e ? e.evt : e;
        if (data.communicationInterfaceType) {
            event.preventDefault();
            selectConnector(data);
        } else if (event.button === 0) {
            event.preventDefault();
            selectConnector(data);
        }
    };

    const closeAndDeselectAll = (): void => {
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
    };

    const getConnectedComponents = useCallback(
        (componentId: string | null | undefined): ConnectionEndpointWithComponent[] => {
            if (!componentId) {
                return [];
            }
            return connections
                .filter((connection) => connection.from.id === componentId || connection.to.id === componentId)
                .map((connection) => {
                    return connection.from.id === componentId ? connection.to : connection.from;
                });
        },
        [connections]
    );

    const connectedComponentsForSelected = useMemo(
        () => getConnectedComponents(selectedComponentId),
        [getConnectedComponents, selectedComponentId]
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

    const handleMouseDown = (event: KonvaEventObject<MouseEvent>): void => {
        const { evt, target } = event;
        if (evt.button === 0 && target.nodeType === "Stage") {
            closeAndDeselectAll();
            event.cancelBubble = true;
            evt.preventDefault();
            evt.stopImmediatePropagation();
            moveLayerRef.current = true;
            if (stageRef.current?.content) {
                stageRef.current.content.style.cursor = "move";
            }
        }
    };

    // Throttle Stage mousemove dispatches to one per animation frame — raw events fire 100+/sec on fast mice and would over-render the store.
    const pendingMouseMoveRef = useRef<{
        layerX: number;
        layerY: number;
        movementX: number;
        movementY: number;
    } | null>(null);
    const mouseMoveRafRef = useRef<number | null>(null);

    const flushMouseMove = useEffectEvent(() => {
        mouseMoveRafRef.current = null;
        const pending = pendingMouseMoveRef.current;
        if (!pending) {
            return;
        }
        pendingMouseMoveRef.current = null;

        const { layerX, layerY, movementX, movementY } = pending;

        setMousePointers({ x: layerX, y: layerY });

        if (newConnection && stageRef.current) {
            setNewConnectionMousePosition({
                x: (layerX - stageRef.current.x()) / stageRef.current.scaleX() - layerPosition.x,
                y: (layerY - stageRef.current.y()) / stageRef.current.scaleY() - layerPosition.y,
            });
        } else if (newConnectionMousePosition) {
            setNewConnectionMousePosition(null);
        }

        if (moveLayerRef.current && stageRef.current) {
            setLayerPosition(
                layerPosition.x + movementX * (GRID_CONFIG.speed / stageRef.current.scaleX()),
                layerPosition.y + movementY * (GRID_CONFIG.speed / stageRef.current.scaleY())
            );
        }
    });

    useEffect(() => {
        return () => {
            if (mouseMoveRafRef.current !== null) {
                cancelAnimationFrame(mouseMoveRafRef.current);
                mouseMoveRafRef.current = null;
            }
        };
    }, []);

    const handleMouseMove = ({ evt }: KonvaEventObject<MouseEvent>): void => {
        const { layerX, layerY, movementX, movementY } = evt;

        const prev = pendingMouseMoveRef.current;
        pendingMouseMoveRef.current = {
            layerX,
            layerY,
            movementX: (prev?.movementX ?? 0) + movementX,
            movementY: (prev?.movementY ?? 0) + movementY,
        };

        if (mouseMoveRafRef.current === null) {
            mouseMoveRafRef.current = requestAnimationFrame(flushMouseMove);
        }
    };

    const handleMouseOut = () => {
        setMousePointers({
            x: -20000,
            y: -20000,
        });
    };

    const handleMouseUp = ({ evt }: KonvaEventObject<MouseEvent>): void => {
        if (evt.button === 0 && moveLayerRef.current) {
            moveLayerRef.current = false;
            if (stageRef.current?.content) {
                stageRef.current.content.style.cursor = "default";
            }
            evt.preventDefault();
            evt.stopPropagation();
        }
    };

    const handleContextMenuAction = (componentType: EditorComponentType): void => {
        const pointerPosition = stageRef.current?.getRelativePointerPosition();
        if (!pointerPosition) {
            return;
        }
        const { x, y } = pointerPosition;

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

    const handleContextMenuOpen = (): void => {
        deselectComponent();
        closeSideBar();
        deselectConnection();
        deselectPointOfAttack();
        deselectConnectionPoint();
        deselectConnector();
    };

    const handleDeleteComponent = () => {
        if (selectedComponent !== undefined && selectedComponent != null && selectedPointOfAttack === undefined) {
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
        if (selectedConnectionId !== undefined && selectedConnectionId != null) {
            openConfirm({
                state: components,
                message: t("deleteDialog.deleteConnMessage", {
                    connectionName: selectedConnection?.name,
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

    const handleDeleteConnectionBetweenComponents = (componentId1: string, componentId2: string): void => {
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
        componentId: string,
        interfaceId: string,
        interfaceName: string | null,
        doCloseSidebar = false
    ): void => {
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

    const handleOnNameChange = (evt: ChangeEvent<HTMLInputElement>): void => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            setSelectedComponentName(evt.target.value);
        }
    };

    const handleOnDescriptionChange = (evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            setSelectedComponentDescription(evt.target.value);
        }
    };

    const handleOnConnectionPointDescriptionChange = (
        evt: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            setSelectedConnectionPointDescription(evt.target.value);
        }
    };

    const handleConnectionNameChange = (evt: ChangeEvent<HTMLInputElement>): void => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            setSelectedConnectionName(evt.target.value);
        }
    };

    const handleOnConnectionPointClicked = ({ evt }: KonvaEventObject<MouseEvent>, connectionPointId: string): void => {
        evt.preventDefault();

        if (evt.button === 0) {
            selectConnectionPoint(connectionPointId);
            deselectComponent();
            deselectConnection();
            showSideBar();
        }
    };

    const handleOnPointOfAttackClicked = (
        { evt }: KonvaEventObject<MouseEvent>,
        pointOfAttackId: string,
        componentId?: string
    ): void => {
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

    const handlePointOfAttackLabelClick = (pointOfAttackId: string, componentId?: string): void => {
        setAssetSearchValue("");
        selectPointOfAttack(pointOfAttackId);
        if (componentId) {
            deselectConnection();
            deselectConnectionPoint();
            selectComponent(componentId);
            showSideBar();
        }
    };

    const handleAssetNameClick = (asset: Asset): void => {
        navigate(`assets/${asset.id}/edit`);
    };

    const handleComponentBreadcrumbClick = (): void => {
        deselectPointOfAttack();
    };

    const handleInterfaceBreadcrumbClick = (): void => {
        if (selectedConnectionPoint?.componentId) {
            deselectConnectionPoint();
            deselectPointOfAttack();
            selectComponent(selectedConnectionPoint.componentId);
        }
    };

    const handleSelectConnectedComponent = (componentId: string, communicationInterfaceId?: string | null): void => {
        setAssetSearchValue("");
        deselectConnection();

        if (communicationInterfaceId) {
            selectConnectionPoint(communicationInterfaceId);
            selectPointOfAttack(communicationInterfaceId);
            deselectComponent();
        } else {
            deselectPointOfAttack();
            selectComponent(componentId);
            deselectConnectionPoint();
        }

        showSideBar();
    };

    const handleChangePointOfAttack = (
        e: ChangeEvent<HTMLInputElement>,
        type: POINTS_OF_ATTACK,
        pointOfAttack?: SystemPointOfAttack
    ): void => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            if (e.target.checked && selectedComponent) {
                addPointOfAttack(selectedComponent, type);
            } else {
                openConfirm({
                    state: components,
                    message: t("deleteDialog.deleteAttPointMessage", {
                        attPointName: t("pointsOfAttackList." + pointOfAttack?.type),
                    }),
                    acceptText: t("deleteDialog.delete"),
                    cancelText: t("deleteDialog.cancel"),
                    onAccept: () => {
                        if (pointOfAttack) {
                            removePointOfAttack(pointOfAttack);
                        }
                    },
                });
            }
        }
    };

    const handleOnAssetChanged = (e: ChangeEvent<HTMLInputElement>, asset: Asset): void => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR) && selectedPointOfAttack != null) {
            if (e.target.checked) {
                addAssetToSelectedPointOfAttack(asset);
            } else {
                removeAssetToSelectedPointOfAttack(asset);
            }
        }
    };

    const handleAddAssetToAllPointsOfAttack = (_event: React.MouseEvent<HTMLElement>, asset: Asset): void => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR) && selectedComponent != null) {
            pointsOfAttackOfSelectedComponent.forEach((pointOfAttack) => {
                addAssetToPointOfAttack(asset, pointOfAttack);
            });
        }
    };

    const handleRemoveAssetFromAllPointsOfAttack = (_event: React.MouseEvent<HTMLElement>, asset: Asset): void => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR) && selectedComponent != null) {
            pointsOfAttackOfSelectedComponent.forEach((pointOfAttack) => {
                removeAssetFromPointOfAttack(asset, pointOfAttack);
            });
        }
    };

    const handleKeyUp = ({ key }: KeyboardEvent): void => {
        if (key === "Escape") {
            closeAndDeselectAll();
        }

        if (key === "Delete") {
            handleDeleteComponent();
            handleDeleteConnection();
        }
    };

    const onRecalculated = (
        connectionId: string,
        waypoints: number[],
        connectionPointsMeta: ConnectionPointMeta[]
    ): void => {
        connectionRecalculated(connectionId, waypoints, connectionPointsMeta);
    };

    const handleAssetSearchChanged = (e: ChangeEvent<HTMLInputElement>): void => {
        setAssetSearchValue(e.target.value);
    };

    const onStageScale = (newScale: number, newPos: Coordinate): void => {
        setStageScale(newScale, newPos);
    };

    const handleCenterEditor = () => {
        let minX = 9999;
        let minY = 9999;
        let maxX = -9999;
        let maxY = -9999;
        const componentsOfProject = components.filter((component) => component.projectId === projectId);

        if (componentsOfProject.length === 0) {
            setLayerPosition(0, 0);
            setStageScale(1, { x: 0, y: 0 });
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
            // Persist scale to Redux too; otherwise it resets on remount.
            setStageScale(stage.scale().x, { x: stage.x(), y: stage.y() });
        }
    };

    const centerOnComponentsEvent = useEffectEvent(() => handleCenterEditor());

    const handleDownloadSystemView = (): void => {
        // Silent on failure today; if needed, surface a toast via showErrorMessage here.
        downloadSystemView().catch((err) => {
            console.error("Failed to export system view", err);
        });
    };

    const toggleCommunicationInterfacesMenu = (component: AugmentedSystemComponent): void => {
        setCommunicationMenuComponent(component);
        setCommunicationMenuOpen((prevState) => !prevState);
    };

    const handleCommunicationSelect = (communicationInterfaceId: string): void => {
        if (!communicationMenuComponent) {
            return;
        }
        const communicationInterface = communicationMenuComponent.communicationInterfaces?.find(
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
                preventDefault: () => {
                    /* empty */
                },
                button: 0, // Simulating left click
                stopPropagation: () => {
                    /* empty */
                },
            },
            target: {
                getStage: () => stageRef.current,
            },
        } as unknown as KonvaEventObject<MouseEvent>;

        // Create a synthetic event object for point of attack
        const pointOfAttackEvent = {
            evt: {
                preventDefault: () => {
                    /* empty */
                },
                button: 0, // Simulating left click
                stopPropagation: () => {
                    /* empty */
                },
            },
        } as unknown as KonvaEventObject<MouseEvent>;

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

    const handleCreateNewCommunicationInterface = ({ name, icon }: { name: string; icon: string }): void => {
        if (!communicationMenuComponent) {
            return;
        }
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
        // oxlint-disable-next-line react-hooks/exhaustive-deps
    }, [layerPosition, stageRef?.current]);

    useEffect(() => {
        loadSystem();
    }, [loadSystem, projectId]);

    useEffect(() => {
        loadComponentTypes();
    }, [loadComponentTypes, projectId]);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    if (!initialized) {
        return <LinearProgress />;
    }

    return (
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
                        handleMouseDown={handleMouseDown}
                        handleMouseMove={handleMouseMove}
                        handleMouseUp={handleMouseUp}
                        onContextMenuOpen={handleContextMenuOpen}
                        onContextMenuAction={handleContextMenuAction}
                        onMouseLeave={handleMouseOut}
                        onKeyUp={handleKeyUp}
                        mousePointers={mousePointers}
                        onScale={onStageScale}
                        scale={stageScale}
                        position={stagePosition}
                        userRole={userRole}
                    >
                        {/* Static helper grid — listening=false skips Konva hit-testing for these shapes on every pointer event. */}
                        <Layer listening={false}>
                            {lineArray.map((_item, index) => (
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

                            {lineArray.map((_item, index) => {
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
                            {newConnection && newConnectionPreviewComponent && (
                                <ConnectionPreview
                                    key={`new-connection-${newConnection.from.id}-${Date.now()}`}
                                    component={newConnectionPreviewComponent}
                                    newConnectionMousePosition={newConnectionMousePosition}
                                />
                            )}

                            {componentConnectionLines.map((line, index) => {
                                const key = `connection-preview-${line.otherComponentInfo.id}-${line.draggedComponentInfo.id}-${index}`;
                                const otherComponent = components.filter(
                                    (component) => component.id === line.otherComponentInfo.id
                                )[0];
                                const draggedComponent = components.filter(
                                    (component) => component.id === line.draggedComponentInfo.id
                                )[0];
                                if (!otherComponent || !draggedComponent) {
                                    return null;
                                }

                                return (
                                    <ConnectionPreview
                                        key={key}
                                        component={otherComponent}
                                        draggedComponent={draggedComponent}
                                    />
                                );
                            })}
                        </Layer>

                        <Layer x={layerPosition.x} y={layerPosition.y} ref={componentLayerRef}>
                            {connections.map((connection, i) => {
                                if (connection.visible === false) {
                                    return <Group key={i}></Group>;
                                }

                                const fromComponent = components.filter(
                                    (component) => component.id === connection.from.id
                                )[0];
                                const toComponent = components.filter(
                                    (component) => component.id === connection.to.id
                                )[0];
                                if (!fromComponent || !toComponent) {
                                    return null;
                                }

                                return (
                                    <SystemComponentConnection
                                        key={i}
                                        {...connection}
                                        onClick={handleSelectConnection}
                                        onPointOfAttackClicked={handleOnPointOfAttackClicked}
                                        fromComponent={fromComponent}
                                        toComponent={toComponent}
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
                                    onDragEnd={(e) => handleComponentDragEnd(e, component.id)}
                                    onDragStart={(e) => handleComponentDragStart(e, component.id)}
                                    onPointOfAttackClicked={handleOnPointOfAttackClicked}
                                    selectedPointOfAttackId={selectedPointOfAttack ? selectedPointOfAttack.id : ""}
                                    component={component}
                                    stageRef={stageRef}
                                    userRole={userRole}
                                    toggleCommunicationInterfacesMenu={toggleCommunicationInterfacesMenu}
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
                    // Drop selected component from sidebar during drag — avoids the MUI 9 FormControl/InputBase setAdornedStart re-render loop on the high-frequency drag path.
                    selectedComponent={isAnyComponentInUse ? undefined : selectedComponent}
                    selectedComponentId={isAnyComponentInUse ? null : selectedComponentId}
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
                    connectedComponents={connectedComponentsForSelected}
                    handleDeleteConnectionBetweenComponents={handleDeleteConnectionBetweenComponents}
                    handleOnConnectionPointDescriptionChange={handleOnConnectionPointDescriptionChange}
                    handleChangeCommunicationInterfaceName={handleChangeCommunicationInterfaceName}
                    handleDeleteCommunicationInterface={handleDeleteCommunicationInterfaceDialog}
                    handlePointOfAttackLabelClick={handlePointOfAttackLabelClick}
                    handleAssetNameClick={handleAssetNameClick}
                    handleSelectConnectedComponent={handleSelectConnectedComponent}
                    handleComponentBreadcrumbClick={handleComponentBreadcrumbClick}
                    handleInterfaceBreadcrumbClick={handleInterfaceBreadcrumbClick}
                />

                <Routes>
                    <Route path="components/edit" element={<ComponentDialogPage />} />
                    <Route path="assets/:assetId/edit" element={<AssetDialogPage />} />
                </Routes>

                <CommunicationContextMenu
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
                        open={true}
                        onClose={handleCloseCommunicationInterfaceDialog}
                        handleCreateNew={handleCreateNewCommunicationInterface}
                    />
                )}
            </Page>
        </LineDrawingProvider>
    );
};

export const EditorPage = memo(CreatePage(HeaderNavigation, EditorPageBody, true));
EditorPage.displayName = "EditorPage";
