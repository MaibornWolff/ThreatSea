import { createReducer } from "@reduxjs/toolkit";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { EditorActions } from "#application/actions/editor.actions.ts";
import { SystemActions } from "#application/actions/system.actions.ts";
import { editorMousePointersAdapter } from "#application/adapters/editor-mouse-pointers.adapter.ts";
import { editorComponentConnectionLinesAdapter } from "#application/adapters/editor-component-connection-lines.adapter.ts";
import {
    editorComponentTypeAdapter,
    type EditorComponentType,
} from "#application/adapters/editor-component-type.adapter.ts";
import { STANDARD_ICON_IMAGES } from "#view/icons/standard-icons.ts";
import type { AnchorOrientation, AnnotationType, Coordinate } from "#api/types/system.types.ts";

export type EditorEntityId = string | number;

export interface EditorConnection {
    from: {
        id: string;
        anchor: AnchorOrientation;
        type: STANDARD_COMPONENT_TYPES | number;
    };
}

type MousePointersState = ReturnType<typeof editorMousePointersAdapter.getInitialState>;
type ComponentConnectionLinesState = ReturnType<typeof editorComponentConnectionLinesAdapter.getInitialState>;
type ComponentTypesAdapterState = ReturnType<typeof editorComponentTypeAdapter.getInitialState>;

type ComponentTypesState = ComponentTypesAdapterState & {
    initialized: boolean;
};

type EditorComponentSelection = Record<string, unknown>;

export interface EditorState {
    selectedComponents: EditorComponentSelection[] | null;
    selectedComponent: string | null;
    selectedConnection: string | null;
    connection: EditorConnection | null;
    layerPosition: Coordinate;
    stageScale: number;
    stagePosition: Coordinate;
    mousePointers: MousePointersState;
    showHelpLines: boolean;
    selectedPointOfAttack: string | null;
    selectedConnectionPoint: string | null;
    componentConnectionLines: ComponentConnectionLinesState;
    assetSearchValue: string;
    openContextMenu: boolean;
    inUseComponents: EditorEntityId[];
    autoSaveStatus: string;
    autoSaveHelperText: string;
    lastAutoSaveDate: string;
    makeScreenShot: boolean;
    componentTypes: ComponentTypesState;
    lastCenteredProjectId: number | null;
    isCapturing: boolean;
    selectedAnnotation: string | null;
    annotationTool: AnnotationType | null;
}

const standardComponentTypes: Record<STANDARD_COMPONENT_TYPES, EditorComponentType> = {
    [STANDARD_COMPONENT_TYPES.USERS]: {
        id: STANDARD_COMPONENT_TYPES.USERS,
        name: "Users",
        symbol: STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.USERS],
        pointsOfAttack: [POINTS_OF_ATTACK.USER_BEHAVIOUR],
        isStandard: true,
        projectId: null,
    },
    [STANDARD_COMPONENT_TYPES.CLIENT]: {
        id: STANDARD_COMPONENT_TYPES.CLIENT,
        name: "Client",
        symbol: STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.CLIENT],
        pointsOfAttack: [
            POINTS_OF_ATTACK.USER_INTERFACE,
            POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
            POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
        ],
        isStandard: true,
        projectId: null,
    },
    [STANDARD_COMPONENT_TYPES.SERVER]: {
        id: STANDARD_COMPONENT_TYPES.SERVER,
        name: "Server",
        symbol: STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.SERVER],
        pointsOfAttack: [POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE],
        isStandard: true,
        projectId: null,
    },
    [STANDARD_COMPONENT_TYPES.DATABASE]: {
        id: STANDARD_COMPONENT_TYPES.DATABASE,
        name: "Database",
        symbol: STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.DATABASE],
        pointsOfAttack: [POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE, POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE],
        isStandard: true,
        projectId: null,
    },
    [STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE]: {
        id: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE,
        name: "Communication Infrastructure",
        symbol: STANDARD_ICON_IMAGES[STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE],
        pointsOfAttack: [POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE],
        isStandard: true,
        projectId: null,
    },
};

const resolveStandardIcon = (componentType: EditorComponentType): EditorComponentType => {
    if (componentType.standardIcon != null && componentType.symbol == null) {
        return {
            ...componentType,
            symbol: STANDARD_ICON_IMAGES[componentType.standardIcon],
        };
    }
    return componentType;
};

const componentTypesInitialState = editorComponentTypeAdapter.getInitialState({
    initialized: false,
}) as ComponentTypesState;

componentTypesInitialState.ids = Object.keys(standardComponentTypes) as STANDARD_COMPONENT_TYPES[];
componentTypesInitialState.entities = {
    ...standardComponentTypes,
};

const defaultState: EditorState = {
    selectedComponents: null,
    selectedComponent: null,
    selectedConnection: null,
    connection: null,
    layerPosition: {
        x: 0,
        y: 0,
    },
    stageScale: 1,
    stagePosition: {
        x: 0,
        y: 0,
    },
    mousePointers: editorMousePointersAdapter.getInitialState(),
    showHelpLines: false,
    selectedPointOfAttack: null,
    selectedConnectionPoint: null,
    componentConnectionLines: editorComponentConnectionLinesAdapter.getInitialState(),
    assetSearchValue: "",
    openContextMenu: false,
    inUseComponents: [],
    autoSaveStatus: "uninitialized",
    autoSaveHelperText: "",
    lastAutoSaveDate: "",
    makeScreenShot: false,
    componentTypes: componentTypesInitialState,
    lastCenteredProjectId: null,
    isCapturing: false,
    selectedAnnotation: null,
    annotationTool: null,
};

const editorReducer = createReducer(defaultState, (builder) => {
    builder.addCase(EditorActions.selectComponent, (state, action) => {
        state.selectedComponent = action.payload;
        state.annotationTool = null;
    });

    builder.addCase(EditorActions.deselectComponent, (state) => {
        state.selectedComponent = null;
    });

    builder.addCase(EditorActions.setConnection, (state, action) => {
        state.connection = action.payload;
        state.annotationTool = null;
    });

    builder.addCase(EditorActions.resetConnection, (state) => {
        state.connection = null;
    });

    builder.addCase(EditorActions.selectConnection, (state, action) => {
        state.selectedConnection = action.payload;
        state.annotationTool = null;
    });

    builder.addCase(EditorActions.deselectConnection, (state) => {
        state.selectedConnection = null;
    });

    builder.addCase(EditorActions.setLayerPosition, (state, action) => {
        state.layerPosition.x = action.payload.x;
        state.layerPosition.y = action.payload.y;
    });

    builder.addCase(EditorActions.setStageScale, (state, action) => {
        state.stageScale = action.payload.scale;
        state.stagePosition.x = action.payload.position.x;
        state.stagePosition.y = action.payload.position.y;
    });

    builder.addCase(EditorActions.setShowHelpLines, (state, action) => {
        state.showHelpLines = action.payload;
    });

    builder.addCase(EditorActions.selectPointOfAttack, (state, action) => {
        state.selectedPointOfAttack = action.payload;
        state.annotationTool = null;
    });

    builder.addCase(EditorActions.deselectPointOfAttack, (state) => {
        state.selectedPointOfAttack = null;
    });

    builder.addCase(EditorActions.selectConnectionPoint, (state, action) => {
        state.selectedConnectionPoint = action.payload;
        state.annotationTool = null;
    });

    builder.addCase(EditorActions.deselectConnectionPoint, (state) => {
        state.selectedConnectionPoint = null;
    });

    builder.addCase(EditorActions.userJoined, (state, action) => {
        console.log("user joined ", action.payload);
        editorMousePointersAdapter.addOne(state.mousePointers, {
            id: action.payload.id,
            name: action.payload.name,
        });
    });

    builder.addCase(EditorActions.userLeft, (state, action) => {
        console.log("user left: ", action.payload);
        editorMousePointersAdapter.removeOne(state.mousePointers, action.payload.id);
    });

    builder.addCase(EditorActions.deselectConnector, (state) => {
        state.connection = null;
    });

    builder.addCase(EditorActions.setAssetSearchValue, (state, action) => {
        state.assetSearchValue = action.payload;
    });

    builder.addCase(EditorActions.setOpenContextMenu, (state, action) => {
        state.openContextMenu = action.payload;
    });

    builder.addCase(EditorActions.addComponentType, (state, action) => {
        editorComponentTypeAdapter.addOne(state.componentTypes, resolveStandardIcon(action.payload));
    });

    builder.addCase(EditorActions.setComponentType, (state, action) => {
        const changes = action.payload.changes as EditorComponentType;
        editorComponentTypeAdapter.updateOne(state.componentTypes, {
            id: action.payload.id,
            changes: resolveStandardIcon(changes),
        });
    });

    builder.addCase(EditorActions.removeComponentType, (state, action) => {
        editorComponentTypeAdapter.removeOne(state.componentTypes, action.payload.id);
    });

    builder.addCase(EditorActions.getComponentTypes.fulfilled, (state, action) => {
        editorComponentTypeAdapter.setMany(state.componentTypes, action.payload.map(resolveStandardIcon));
    });

    builder.addCase(EditorActions.addComponentConnectionLine, (state, action) => {
        editorComponentConnectionLinesAdapter.addOne(state.componentConnectionLines, {
            id: action.payload.id,
            draggedComponentInfo: action.payload.draggedComponentInfo,
            otherComponentInfo: action.payload.otherComponentInfo,
        });
    });

    builder.addCase(EditorActions.removeComponentConnectionLine, (state, action) => {
        editorComponentConnectionLinesAdapter.removeOne(state.componentConnectionLines, action.payload.id);
    });

    builder.addCase(EditorActions.addInUseComponent, (state, action) => {
        state.inUseComponents.push(action.payload);
    });

    builder.addCase(EditorActions.removeInUseComponent, (state, action) => {
        state.inUseComponents = [...state.inUseComponents].filter((item) => item !== action.payload);
    });

    builder.addCase(EditorActions.setAutoSaveStatus, (state, action) => {
        state.autoSaveStatus = action.payload;
    });

    builder.addCase(EditorActions.makeAScreenshot, (state) => {
        state.makeScreenShot = !state.makeScreenShot;
    });

    builder.addCase(EditorActions.setAutoSaveText, (state, action) => {
        state.autoSaveHelperText = action.payload;
    });

    builder.addCase(EditorActions.setLastAutoSaveDate, (state, action) => {
        state.lastAutoSaveDate = action.payload;
    });

    builder.addCase(EditorActions.setLastCenteredProjectId, (state, action) => {
        state.lastCenteredProjectId = action.payload;
    });

    builder.addCase(EditorActions.setIsCapturing, (state, action) => {
        state.isCapturing = action.payload;
    });

    builder.addCase(EditorActions.selectAnnotation, (state, action) => {
        state.selectedAnnotation = action.payload;
        state.annotationTool = null;
    });

    builder.addCase(EditorActions.deselectAnnotation, (state) => {
        state.selectedAnnotation = null;
    });

    builder.addCase(EditorActions.setAnnotationTool, (state, action) => {
        state.annotationTool = action.payload;
    });

    builder.addCase(SystemActions.setLoadedProjectId, (state) => {
        state.annotationTool = null;
        state.selectedAnnotation = null;
    });
});

export default editorReducer;
