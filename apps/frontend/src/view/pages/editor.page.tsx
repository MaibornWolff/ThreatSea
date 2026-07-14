/**
 * @module editor.page - Defines the editor
 *     page.
 */

import { Box, LinearProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Group, Layer, Line } from "react-konva";
import { Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { useAssets } from "#application/hooks/use-assets.hook.ts";
import { useAutoSavePreview } from "#application/hooks/use-auto-save-preview.hook.ts";
import { useAnnotationDrawing, ANNOTATION_STROKE_WIDTH } from "#application/hooks/use-annotation-drawing.hook.ts";
import { useEditor, type EditorConnectionAnchor } from "#application/hooks/use-editor.hook.ts";
import { useKeyboardComponentMove, type HelpLines } from "#application/hooks/use-keyboard-component-move.hook.ts";
import { useEditorAnnotations } from "#application/hooks/use-editor-annotations.hook.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { usePageTitle } from "#application/hooks/use-page-title.hook.ts";
import { DEFAULT_ANNOTATION_COLOR } from "#view/colors/annotation.colors.ts";
import { AnnotationDrawingPreview } from "#view/components/editor-components/annotation-drawing-preview.component.tsx";
import { ConnectionPreview } from "#view/components/editor-components/connection-preview.component.tsx";
import {
    AnnotationsCanvasLayer,
    type AnnotationsCanvasLayerHandle,
} from "#view/components/editor-components/annotations-canvas-layer.component.tsx";
import { EditorSidebar } from "#view/components/editor-components/editor-sidebar.component.tsx";
import {
    EditorStage,
    MAX_STAGE_SCALE,
    MIN_STAGE_SCALE,
} from "#view/components/editor-components/editor-stage.component.tsx";
import { EditorToolbar } from "#view/components/editor-components/editor-toolbar.component.tsx";
import { TextEditingToolbarLayer } from "#view/components/editor-components/text-editing-toolbar-layer.component.tsx";
import { Page } from "#view/components/page.component.tsx";
import { SystemComponentConnection } from "#view/components/editor-components/system-component-connection.component.tsx";
import { ConnectionEditHandles } from "#view/components/editor-components/connection-edit-handles.component.tsx";
import { SystemComponent } from "#view/components/editor-components/system-component.component.tsx";
import { CreatePage } from "#view/components/create-page.component.tsx";
import { HeaderUtilityControls } from "#view/components/header-utility-controls.component.tsx";
import AssetDialogPage from "./asset-dialog.page";
import ComponentDialogPage from "./component-dialog.page";
import { CommunicationContextMenu } from "#view/components/editor-components/editor-communication-interface-context-menu.component.tsx";
import { useAlert } from "#application/hooks/use-alert.hook.ts";
import CommunicationInterfaceDialog from "#view/dialogs/add-communication-interface.dialog.tsx";
import { LineDrawingProvider } from "#view/components/editor-components/contexts/LineDrawingProvider.tsx";
import { GRID } from "#utils/connection-waypoints.ts";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import { systemSelectors } from "#application/selectors/system.selectors.ts";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Stage as KonvaStage } from "konva/lib/Stage";
import type { Layer as KonvaLayer } from "konva/lib/Layer";
import type { Asset } from "#api/types/asset.types.ts";
import type {
    AnnotationChanges,
    AnnotationType,
    AugmentedSystemComponent,
    ConnectionEndpointWithComponent,
    Coordinate,
    SystemPointOfAttack,
    TextAnnotation,
} from "#api/types/system.types.ts";
import type { EditorComponentType } from "#application/adapters/editor-component-type.adapter.ts";
import type { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";

// Move these outside the component to avoid recreating on each render
const GRID_CONFIG = {
    speed: 1.5,
    gridSizeX: GRID,
    gridSizeY: GRID,
    renderedGridSizeX: 20,
    renderedGridSizeY: 20,
};

// Memoize line array creation
const createLineArray = (): number[] => new Array(400).fill(0);

// True when a keyboard event originated from a focused text input — used by
// the global key handler to skip canvas deletes while the user is typing.
const isEditableEventTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    if (target.isContentEditable) {
        return true;
    }
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
};

interface EditorPageBodyProps {
    updateAutoSaveOnClick?: (handler: (() => void) | undefined) => void;
}

const EditorPageBody = ({ updateAutoSaveOnClick }: EditorPageBodyProps) => {
    const theme = useTheme();
    const { projectId: projectIdParam } = useParams<{ projectId: string }>();
    const projectId = Number.parseInt(projectIdParam ?? "", 10);
    const stageRef = useRef<KonvaStage | null>(null);
    const [newConnectionMousePosition, setNewConnectionMousePosition] = useState<Coordinate | null>(null);
    const componentLayerRef = useRef<KonvaLayer | null>(null);
    const sidebarRef = useRef<HTMLDivElement | null>(null);
    const moveLayerRef = useRef(false);
    // Ref for the hot mousemove path; state drives toolbar/transformer visibility.
    const isAnnotationDraggingRef = useRef(false);
    const [isAnnotationDragging, setIsAnnotationDragging] = useState(false);
    const handleAnnotationDragStateChange = useCallback((isDragging: boolean): void => {
        isAnnotationDraggingRef.current = isDragging;
        setIsAnnotationDragging(isDragging);
    }, []);
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
        connectionEdited,
        resetConnectionRouting,
        selectConnectionPoint,
        deselectConnectionPoint,
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
    usePageTitle(t("system", { ns: "common" }));

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

    const {
        annotations,
        selectedAnnotation,
        selectedAnnotationId,
        annotationTool,
        createAnnotation,
        updateAnnotation,
        removeAnnotation,
        selectAnnotation,
        deselectAnnotation,
        setAnnotationTool,
    } = useEditorAnnotations({ projectId });

    const isEditor = checkUserRole(userRole, USER_ROLES.EDITOR);

    const storedAnnotationColor = useAppSelector((state) =>
        systemSelectors.selectDefaultAnnotationColor(state, projectId)
    );
    const annotationColor = storedAnnotationColor ?? DEFAULT_ANNOTATION_COLOR;
    const setAnnotationColor = (color: string): void => {
        dispatch(SystemActions.setDefaultAnnotationColor({ projectId, color }));
    };

    const { drawingPreview, cancelDrawing, tryStartDrawing, updateDrawingPreview, commitDrawing } =
        useAnnotationDrawing({ stageRef, layerPosition, isEditor, annotationColor, createAnnotation });

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage?.content) {
            return;
        }
        if (annotationTool === null) {
            return;
        }
        stage.content.style.cursor = annotationTool === "text" ? "text" : "crosshair";
        return () => {
            if (stage.content) {
                stage.content.style.cursor = "default";
            }
        };
    }, [annotationTool]);

    const effectiveAnnotationTool = loadedProjectId === projectId ? annotationTool : null;

    const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
    const editingAnnotation = editingAnnotationId
        ? (annotations.find((annotation) => annotation.id === editingAnnotationId) ?? null)
        : null;
    const handleRequestEdit = useCallback((id: string) => {
        setEditingAnnotationId(id);
    }, []);

    const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);

    const handleConnectionHoverChange = useCallback((connectionId: string, hovering: boolean): void => {
        setHoveredConnectionId((current) => (hovering ? connectionId : current === connectionId ? null : current));
    }, []);

    // Idempotent exit; discards the annotation if it was never typed in.
    const handleExitEdit = useCallback(
        (id: string): void => {
            if (editingAnnotationId !== id) {
                return;
            }
            const target = annotations.find((a) => a.id === id);
            if (target?.type === "text" && (target.text ?? "").trim().length === 0) {
                removeAnnotation(id);
            }
            setEditingAnnotationId(null);
        },
        [editingAnnotationId, annotations, removeAnnotation]
    );

    // Effect-based exit-on-selection-change — handler-level guards can run with
    // a stale editingAnnotationId because EditorTextAnnotation is memo'd on
    // annotation/selected/editable/editing only.
    useEffect(() => {
        if (editingAnnotationId !== null && selectedAnnotationId !== editingAnnotationId) {
            handleExitEdit(editingAnnotationId);
        }
    }, [selectedAnnotationId, editingAnnotationId, handleExitEdit]);

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

    const { handleKeyDown, clearKeyboardNudgeTimeouts } = useKeyboardComponentMove({
        selectedComponent,
        isEditor,
        isAnyComponentInUse,
        layerPosition,
        gridSizeX: GRID_CONFIG.gridSizeX,
        gridSizeY: GRID_CONFIG.gridSizeY,
        currentHelpLinesRef,
        moveComponent,
        updateConnectionsOfComponent,
        setShowHelpLines,
    });

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
            handleCenterEditorRef.current();
            dispatch(EditorActions.setLastCenteredProjectId(projectId));
            if (location.state) {
                navigate(location.pathname, { replace: true, state: {} });
            }
        });
        return () => cancelAnimationFrame(raf);
    }, [loadedProjectId, projectId, lastCenteredProjectId, dispatch, navigate, location.pathname, location.state]);

    const handleComponentDragStart = (_event: KonvaEventObject<DragEvent>, componentId: string): void => {
        // Cancel any pending keyboard-nudge hide so it can't clear the drag's help lines.
        clearKeyboardNudgeTimeouts();
        addInUseComponent(componentId);
        selectComponent(componentId);
        deselectConnection();
        deselectPointOfAttack();
        closeSideBar();

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

    const handleComponentDragEnd = (_event: KonvaEventObject<DragEvent>, componentId: string): void => {
        removeInUseComponent(componentId);
        setShowHelpLines(false);
        updateConnectionsOfComponent(componentId);
        deselectComponent();

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
        if (annotationTool !== null) {
            return;
        }
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
            deselectAnnotation();
            showSideBar();
        }
    };

    const handleSelectConnection = ({ evt }: KonvaEventObject<MouseEvent>, id: string): void => {
        if (annotationTool !== null) {
            return;
        }
        if (!evt.defaultPrevented && evt.button === 0) {
            evt.preventDefault();

            deselectPointOfAttack();
            selectConnection(id);
            deselectComponent();
            deselectConnectionPoint();
            deselectAnnotation();
            showSideBar();
        }
    };

    const handleSelectAnnotation = (id: string, options?: { openSidebar?: boolean }): void => {
        const annotation = annotations.find((a) => a.id === id);
        selectAnnotation(id);
        deselectComponent();
        deselectConnection();
        deselectPointOfAttack();
        deselectConnectionPoint();
        deselectConnector();
        if (options?.openSidebar === false || annotation?.type === "text") {
            closeSideBar();
        } else {
            showSideBar();
        }
    };

    const annotationsLayerRef = useRef<AnnotationsCanvasLayerHandle>(null);
    const lastSelectedAnnotationRef = useRef<typeof selectedAnnotation>(undefined);

    useEffect(() => {
        if (selectedAnnotation) {
            lastSelectedAnnotationRef.current = selectedAnnotation;
        }
    }, [selectedAnnotation]);

    // Grace window for the dismissal mousedown some browsers fire on the
    // underlying page when the native <input type="color"> closes.
    const lastColorInteractionRef = useRef(0);
    const bumpColorInteraction = (): void => {
        lastColorInteractionRef.current = Date.now();
    };

    const handleAnnotationColorPreview = (stroke: string): void => {
        annotationsLayerRef.current?.setPreviewColor(stroke);
        bumpColorInteraction();
    };

    const handleAnnotationColorChange = (stroke: string): void => {
        annotationsLayerRef.current?.setPreviewColor(null);
        bumpColorInteraction();
        const target = selectedAnnotation ?? lastSelectedAnnotationRef.current;
        if (target) {
            updateAnnotation(target.id, { type: target.type, stroke });
        }
    };

    const handleAnnotationChange = (changes: AnnotationChanges): void => {
        if (selectedAnnotationId) {
            updateAnnotation(selectedAnnotationId, changes);
        }
    };

    const handleSetAnnotationTool = (tool: AnnotationType | null): void => {
        if (tool !== null) {
            closeAndDeselectAll();
        }
        setAnnotationTool(tool);
    };

    const handleDeleteAnnotation = (): void => {
        if (selectedAnnotationId) {
            removeAnnotation();
            closeSideBar();
            setEditingAnnotationId(null);
        }
    };

    const handleSelectAnchor = (e: MouseEvent | KonvaEventObject<MouseEvent>, data: ConnectorSelection): void => {
        if (annotationTool !== null) {
            return;
        }
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
        if (editingAnnotation?.type === "text" && (editingAnnotation.text ?? "").trim().length === 0) {
            removeAnnotation(editingAnnotation.id);
        }
        deselectComponent();
        closeSideBar();
        deselectConnection();
        deselectPointOfAttack();
        deselectConnectionPoint();
        deselectConnector();
        deselectAnnotation();
        setEditingAnnotationId(null);
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

        // Annotation drawing intercepts the stage before pan/deselect.
        if (!editingAnnotationId && tryStartDrawing(annotationTool, event)) {
            return;
        }

        if (evt.button === 0 && target.nodeType === "Stage") {
            // Ignore the dismissal click that fires after the native color picker closes.
            if (Date.now() - lastColorInteractionRef.current < 500) {
                return;
            }
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

    const flushMouseMove = () => {
        mouseMoveRafRef.current = null;
        const pending = pendingMouseMoveRef.current;
        if (!pending) {
            return;
        }
        pendingMouseMoveRef.current = null;

        const { layerX, layerY, movementX, movementY } = pending;

        if (updateDrawingPreview()) {
            return;
        }

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
    };

    // Plain ref — rAF callbacks run outside React's "inside an Effect" window,
    // where useEffectEvent has undefined behavior in production builds.
    const flushMouseMoveRef = useRef(flushMouseMove);
    flushMouseMoveRef.current = flushMouseMove;

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
        // If the user released the button outside the stage, handleMouseUp
        // never fires — mirror its reset so re-entry doesn't resume panning.
        if (moveLayerRef.current) {
            moveLayerRef.current = false;
            if (stageRef.current?.content) {
                stageRef.current.content.style.cursor = "default";
            }
        }
    };

    const handleMouseUp = ({ evt }: KonvaEventObject<MouseEvent>): void => {
        if (evt.button === 0 && drawingPreview) {
            const toolBeforeCommit = annotationTool;
            const newId = commitDrawing(annotationTool);
            if (newId) {
                if (toolBeforeCommit && toolBeforeCommit !== "freehand") {
                    setAnnotationTool(null);
                }
                // Only text auto-selects (to enter edit mode). For freehand, auto-selecting
                // would attach Konva's Transformer whose anchor mouseleave wipes our tool cursor.
                if (toolBeforeCommit === "text") {
                    selectAnnotation(newId);
                    setEditingAnnotationId(newId);
                }
                deselectComponent();
                deselectConnection();
                deselectPointOfAttack();
                deselectConnectionPoint();
                deselectConnector();
            }
            return;
        }

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
        if (annotationTool !== null) {
            return;
        }
        evt.preventDefault();

        if (evt.button === 0) {
            selectConnectionPoint(connectionPointId);
            deselectComponent();
            deselectConnection();
            deselectAnnotation();
            showSideBar();
        }
    };

    const handleOnPointOfAttackClicked = (
        { evt }: KonvaEventObject<MouseEvent>,
        pointOfAttackId: string,
        componentId?: string
    ): void => {
        if (annotationTool !== null) {
            return;
        }
        evt.preventDefault();

        if (evt.button === 0) {
            setAssetSearchValue("");
            selectPointOfAttack(pointOfAttackId);
            deselectAnnotation();
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

    const handleKeyUp = (event: KeyboardEvent): void => {
        const { key } = event;
        if (key === "Escape") {
            if (annotationTool || drawingPreview) {
                setAnnotationTool(null);
                cancelDrawing();
            }
            closeAndDeselectAll();
        }

        if (key === "Delete" || key === "Backspace") {
            // Skip when the keystroke came from an editable field
            if (isEditableEventTarget(event.target)) {
                return;
            }
            handleDeleteComponent();
            handleDeleteConnection();
            if (selectedAnnotationId) {
                removeAnnotation();
                closeSideBar();
                setEditingAnnotationId(null);
            }
        }
    };

    const handleAssetSearchChanged = (e: ChangeEvent<HTMLInputElement>): void => {
        setAssetSearchValue(e.target.value);
    };

    const onStageScale = (newScale: number, newPos: Coordinate): void => {
        setStageScale(newScale, newPos);
    };

    const handleCenterEditor = () => {
        if (!stageRef.current || !componentLayerRef.current) {
            return;
        }
        const stage = stageRef.current;
        const layer = componentLayerRef.current;

        const rect = layer.getClientRect({ relativeTo: layer });

        if (rect.width <= 0 || rect.height <= 0) {
            setLayerPosition(0, 0);
            setStageScale(1, { x: 0, y: 0 });
            return;
        }

        // Same 5% padding as captureScreenshot in use-auto-save-preview.hook.
        const paddingRatio = 0.05;
        const paddedWidth = rect.width * (1 + paddingRatio * 2);
        const paddedHeight = rect.height * (1 + paddingRatio * 2);

        // Fit-to-view scale, clamped to the editor's existing zoom bounds.
        const fitScale = Math.min(stage.width() / paddedWidth, stage.height() / paddedHeight);
        const newScale = Math.min(MAX_STAGE_SCALE, Math.max(MIN_STAGE_SCALE, fitScale));
        stage.scale({ x: newScale, y: newScale });

        // Solve for layerPosition that puts the bbox center at the viewport center.
        // screen = (layerLocal + layerPosition) * newScale + stage.{x,y}
        const bboxCenterX = rect.x + rect.width / 2;
        const bboxCenterY = rect.y + rect.height / 2;
        const layerX = (stage.width() / 2 - stage.x()) / newScale - bboxCenterX;
        const layerY = (stage.height() / 2 - stage.y()) / newScale - bboxCenterY;

        setLayerPosition(layerX, layerY);
        // Persist scale to Redux too; otherwise it resets on remount.
        setStageScale(newScale, { x: stage.x(), y: stage.y() });
    };

    // Plain ref — the rAF callback runs outside React's "inside an Effect"
    // window, where useEffectEvent has undefined behavior in production builds.
    const handleCenterEditorRef = useRef(handleCenterEditor);
    handleCenterEditorRef.current = handleCenterEditor;

    const handleDownloadSystemView = (): void => {
        // Silent on failure today; if needed, surface a toast via showErrorMessage here.
        downloadSystemView().catch((err) => {
            console.error("Failed to export system view", err);
        });
    };

    const toggleCommunicationInterfacesMenu = (component: AugmentedSystemComponent): void => {
        if (annotationTool !== null) {
            return;
        }
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
                        onKeyDown={handleKeyDown}
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
                                    stroke={theme.palette.border.canvas}
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
                                        stroke={theme.palette.border.canvas}
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
                                        stroke={theme.palette.border.canvasHelpLine}
                                        strokeWidth={0.75}
                                    />
                                    <Line
                                        points={[
                                            -1000,
                                            currentHelpLinesRef.current.y2,
                                            10000,
                                            currentHelpLinesRef.current.y2,
                                        ]}
                                        stroke={theme.palette.border.canvasHelpLine}
                                        strokeWidth={0.75}
                                    />
                                    <Line
                                        points={[
                                            currentHelpLinesRef.current.x,
                                            -1000,
                                            currentHelpLinesRef.current.x,
                                            10000,
                                        ]}
                                        stroke={theme.palette.border.canvasHelpLine}
                                        strokeWidth={0.75}
                                    />
                                    <Line
                                        points={[
                                            currentHelpLinesRef.current.x2,
                                            -1000,
                                            currentHelpLinesRef.current.x2,
                                            10000,
                                        ]}
                                        stroke={theme.palette.border.canvasHelpLine}
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

                                // A connection whose endpoint component is gone has no valid line.
                                const endpointsExist =
                                    components.some((component) => component.id === connection.from.id) &&
                                    components.some((component) => component.id === connection.to.id);
                                if (!endpointsExist) {
                                    return null;
                                }

                                return (
                                    <Group key={i}>
                                        <SystemComponentConnection
                                            {...connection}
                                            onClick={handleSelectConnection}
                                            onPointOfAttackClicked={handleOnPointOfAttackClicked}
                                            selected={selectedConnectionId === connection.id}
                                            stageRef={stageRef}
                                            hovered={hoveredConnectionId === connection.id}
                                            onHoverChange={handleConnectionHoverChange}
                                        />
                                        {isEditor &&
                                            connection.waypoints != null &&
                                            connection.waypoints.length >= 4 && (
                                                <ConnectionEditHandles
                                                    connectionId={connection.id}
                                                    waypoints={connection.waypoints}
                                                    onCommit={connectionEdited}
                                                    selected={selectedConnectionId === connection.id}
                                                    onSelect={(event) => handleSelectConnection(event, connection.id)}
                                                    onHoverChange={handleConnectionHoverChange}
                                                />
                                            )}
                                    </Group>
                                );
                            })}
                            <AnnotationsCanvasLayer
                                ref={annotationsLayerRef}
                                annotations={annotations}
                                selectedAnnotationId={selectedAnnotationId}
                                editingAnnotationId={editingAnnotationId}
                                editable={isEditor}
                                stageScale={stageScale}
                                onSelect={handleSelectAnnotation}
                                onChange={updateAnnotation}
                                onDragStateChange={handleAnnotationDragStateChange}
                                onRequestEdit={handleRequestEdit}
                                onExitEdit={handleExitEdit}
                            />
                            <AnnotationDrawingPreview
                                drawingPreview={drawingPreview}
                                annotationTool={annotationTool}
                                color={annotationColor}
                                strokeWidth={ANNOTATION_STROKE_WIDTH}
                            />
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
                        {(editingAnnotation?.type === "text" || selectedAnnotation?.type === "text") && (
                            <TextEditingToolbarLayer
                                annotation={
                                    editingAnnotation?.type === "text"
                                        ? editingAnnotation
                                        : (selectedAnnotation as TextAnnotation)
                                }
                                layerPosition={layerPosition}
                                stagePosition={stagePosition}
                                stageScale={stageScale}
                                hidden={isAnnotationDragging}
                                onChange={handleAnnotationChange}
                                onColorChange={handleAnnotationColorChange}
                                onColorPreview={handleAnnotationColorPreview}
                                onColorOpen={bumpColorInteraction}
                                onDelete={handleDeleteAnnotation}
                            />
                        )}
                    </EditorStage>

                    <EditorToolbar
                        onCenterEditor={handleCenterEditor}
                        onDownloadSystemView={handleDownloadSystemView}
                        showAnnotationTools={isEditor}
                        annotationTool={effectiveAnnotationTool}
                        onSetAnnotationTool={handleSetAnnotationTool}
                        annotationColor={annotationColor}
                        onSetAnnotationColor={setAnnotationColor}
                    />
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
                    handleResetConnectionRouting={() => {
                        if (selectedConnection) {
                            resetConnectionRouting(selectedConnection.id);
                        }
                    }}
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
                    selectedAnnotation={selectedAnnotation}
                    handleAnnotationColorChange={handleAnnotationColorChange}
                    handleAnnotationColorPreview={handleAnnotationColorPreview}
                    handleAnnotationChange={handleAnnotationChange}
                    handleDeleteAnnotation={handleDeleteAnnotation}
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

export const EditorPage = memo(CreatePage(HeaderUtilityControls, EditorPageBody, true));
EditorPage.displayName = "EditorPage";
