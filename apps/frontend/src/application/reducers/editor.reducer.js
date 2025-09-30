/**
 * @module editor.reducer - Defines the reducer for
 *     the system editor.
 */

import { createReducer } from "@reduxjs/toolkit";
import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";
import { EditorActions } from "../actions/editor.actions";
import { editorMousePointersAdapter } from "../adapters/editor-mouse-pointers.adapter";
import serverImg from "../../images/server.png";
import databaseImg from "../../images/database.png";
import desktopImg from "../../images/desktop.png";
import userImg from "../../images/user.png";
import communicationInfrastructureImg from "../../images/communication-infrastructure.png";
import { STANDARD_COMPONENT_TYPES } from "../../api/types/standard-component.types";
import { componentTypeAdapter } from "../adapters/component-type.adapter";
import { editorComponentConnectionLinesAdapter } from "../adapters/editor-component-connection-lines.adapter";

/**
 * Initial state of the editor.
 *
 * @type {array of object} selectedComponents
 * @type {object} connection - Holds from where the connection line is comming from.
 * @type {object} layerPosition - Keeps track where on the 2D spectrum the eye vector is.
 * @type {number} stageScale - Defines the zoom scale of the editor page.
 * @type {object} stagePosition - Keeps track of the stage position when zooming.
 *
 * @type {object} mousePointers - Holds the mouse pointers of other users that joined.
 *     @type {array of string} ids - Holds ids of the mouse cursors.
 *     @type {object of objects} entities - Holds the mouse cursor data mapped to their id.
 *        Entity: @type {string} Key - id of the entity.
 *        Values:
 *             => @type {string} id - id of the cursor.
 *             => @type {string} name - The name of the user.
 *
 * @type {boolean} showHelpLines - Flag that indicates if help lines should be shown.
 * @type {string} selectedPointOfAttack - The selected id from the point of attack.
 * @type {string} selectedConnectionPoint - The selected if from the connection point.
 *
 * @type {object} componentConnectionLines - When dragged, holds the connection lines of the
 *     component.
 *     @type {array of string} ids - Holds ids of the connection lines.
 *     @type {object of objects} entities - Holds the connection line data mapped to their id.
 *        Entity: @type {string} Key - id of the entity.
 *        Values:
 *             => @type {string} id - id of the connection line.
 *             => @type {object} draggedComponentInfo - Information about the line anchoring of the
 *                    dragged component.
 *             => @type {object} otherComponentInfo - Information about the line anchoring of the
 *                    component its connected to.
 *
 * @type {string} assetSearchValue - Search key for filtering assets in the context menu.
 * @type {boolean} openContextMenu - Indicator if the context menu for creating components is opened.
 * @type {object} inUseComponents - Keeps track of the components that are dragged by holding its id.
 * @type {string} autoSaveStatus - String that tells wether the system save is up to date.
 * @type {string} autoSaveHelperText - The text displayed by the save tooltip.
 * @type {boolean} makeAScreenshot - Indicator to tell if another screenshot of the system should be taken.
 *
 * @type {object} componentTypes - Holds the basic components that can be used in threatsea.
 *     @type {boolean} initialized
 *     @type {array of string/number} ids - Holds the ids of the components and the custom ones.
 *     @type {object of objects} entities - Mappes the ids to the data of the components.
 *        Entity: @type {string} Key - id of the entity.
 *        Values:
 *             => @type {string} id - id of the component.
 *             => @type {object} name - Name of the component.
 *             => @type {object} symbol - Path to the image of the component icon.
 *
 * @type {string} selectedComponent - id of the currently selected component.
 * @type {string} selectedConnection - id of the currently selected connection.
 */
const defaultState = {
    selectedComponents: null,
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
    componentTypes: {
        initialized: false,
        ids: [
            STANDARD_COMPONENT_TYPES.USERS,
            STANDARD_COMPONENT_TYPES.CLIENT,
            STANDARD_COMPONENT_TYPES.SERVER,
            STANDARD_COMPONENT_TYPES.DATABASE,
            STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE,
        ],
        entities: {
            [STANDARD_COMPONENT_TYPES.USERS]: {
                id: STANDARD_COMPONENT_TYPES.USERS,
                name: "Users",
                symbol: userImg,
                pointsOfAttack: [POINTS_OF_ATTACK.USER_BEHAVIOUR],
                isStandard: true,
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
            },
            [STANDARD_COMPONENT_TYPES.SERVER]: {
                id: STANDARD_COMPONENT_TYPES.SERVER,
                name: "Server",
                symbol: serverImg,
                pointsOfAttack: [POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE],
                isStandard: true,
            },
            [STANDARD_COMPONENT_TYPES.DATABASE]: {
                id: STANDARD_COMPONENT_TYPES.DATABASE,
                name: "Database",
                symbol: databaseImg,
                pointsOfAttack: [
                    POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE,
                    POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE,
                ],
                isStandard: true,
            },
            [STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE]: {
                id: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE,
                name: "Communication Infrastructure",
                symbol: communicationInfrastructureImg,
                pointsOfAttack: [POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE],
                isStandard: true,
            },
        },
    },
};

/**
 * The EditorReducer updates the current state based on incoming actions.
 * @function editorReducer
 */
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
        componentTypeAdapter.addOne(state.componentTypes, action.payload);
    });

    builder.addCase(EditorActions.setComponentType, (state, action) => {
        componentTypeAdapter.updateOne(state.componentTypes, action.payload);
    });

    builder.addCase(EditorActions.removeComponentType, (state, action) => {
        componentTypeAdapter.removeOne(state.componentTypes, action.payload.id);
    });

    builder.addCase(EditorActions.getComponentTypes.fulfilled, (state, action) => {
        componentTypeAdapter.setMany(state.componentTypes, action.payload);
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
