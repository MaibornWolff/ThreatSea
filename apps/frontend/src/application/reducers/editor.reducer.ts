import { createReducer } from "@reduxjs/toolkit";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { EditorActions } from "../actions/editor.actions";
import { editorMousePointersAdapter } from "../adapters/editor-mouse-pointers.adapter";
import { editorComponentConnectionLinesAdapter } from "../adapters/editor-component-connection-lines.adapter";
import { editorComponentTypeAdapter, type EditorComponentType } from "../adapters/editor-component-type.adapter";
import serverImg from "../../images/server.png";
import databaseImg from "../../images/database.png";
import desktopImg from "../../images/desktop.png";
import userImg from "../../images/user.png";
import communicationInfrastructureImg from "../../images/communication-infrastructure.png";

export interface EditorPosition {
    x: number;
    y: number;
}

export type EditorEntityId = string | number;

export type EditorConnection = Record<string, unknown>;

type MousePointersState = ReturnType<typeof editorMousePointersAdapter.getInitialState>;
type ComponentConnectionLinesState = ReturnType<typeof editorComponentConnectionLinesAdapter.getInitialState>;
type ComponentTypesAdapterState = ReturnType<typeof editorComponentTypeAdapter.getInitialState>;

type ComponentTypesState = ComponentTypesAdapterState & {
    initialized: boolean;
};

type EditorComponentSelection = Record<string, unknown>;

export interface EditorState {
    selectedComponents: EditorComponentSelection[] | null;
    selectedComponent: EditorEntityId | null;
    selectedConnection: EditorEntityId | null;
    connection: EditorConnection | null;
    layerPosition: EditorPosition;
    stageScale: number;
    stagePosition: EditorPosition;
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
}

const standardComponentTypes: Record<string, EditorComponentType> = {
    [STANDARD_COMPONENT_TYPES.USERS]: {
        id: STANDARD_COMPONENT_TYPES.USERS,
        name: "Users",
        symbol: userImg,
        pointsOfAttack: [POINTS_OF_ATTACK.USER_BEHAVIOUR],
        isStandard: true,
        projectId: null,
    },
    [STANDARD_COMPONENT_TYPES.CLIENT]: {
        id: STANDARD_COMPONENT_TYPES.CLIENT,
        name: "Client",
        symbol: desktopImg,
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
        symbol: serverImg,
        pointsOfAttack: [POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE],
        isStandard: true,
        projectId: null,
    },
    [STANDARD_COMPONENT_TYPES.DATABASE]: {
        id: STANDARD_COMPONENT_TYPES.DATABASE,
        name: "Database",
        symbol: databaseImg,
        pointsOfAttack: [POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE, POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE],
        isStandard: true,
        projectId: null,
    },
    [STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE]: {
        id: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE,
        name: "Communication Infrastructure",
        symbol: communicationInfrastructureImg,
        pointsOfAttack: [POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE],
        isStandard: true,
        projectId: null,
    },
};

const componentTypesInitialState = editorComponentTypeAdapter.getInitialState({
    initialized: false,
}) as ComponentTypesState;

componentTypesInitialState.ids = Object.keys(standardComponentTypes);
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
};

const editorReducer = createReducer(defaultState, (builder) => {
    builder.addCase(EditorActions.selectComponent, (state, action) => {
        state.selectedComponent = action.payload;
    });

    builder.addCase(EditorActions.deselectComponent, (state) => {
        state.selectedComponent = null;
    });

    builder.addCase(EditorActions.setConnection, (state, action) => {
        state.connection = action.payload;
    });

    builder.addCase(EditorActions.resetConnection, (state) => {
        state.connection = null;
    });

    builder.addCase(EditorActions.selectConnection, (state, action) => {
        state.selectedConnection = action.payload;
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
    });

    builder.addCase(EditorActions.deselectPointOfAttack, (state) => {
        state.selectedPointOfAttack = null;
    });

    builder.addCase(EditorActions.selectConnectionPoint, (state, action) => {
        state.selectedConnectionPoint = action.payload;
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
        editorComponentTypeAdapter.addOne(state.componentTypes, action.payload);
    });

    builder.addCase(EditorActions.setComponentType, (state, action) => {
        editorComponentTypeAdapter.updateOne(state.componentTypes, action.payload);
    });

    builder.addCase(EditorActions.removeComponentType, (state, action) => {
        editorComponentTypeAdapter.removeOne(state.componentTypes, action.payload.id);
    });

    builder.addCase(EditorActions.getComponentTypes.fulfilled, (state, action) => {
        editorComponentTypeAdapter.setMany(state.componentTypes, action.payload);
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
});

export default editorReducer;
