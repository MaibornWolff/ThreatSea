/**
 * @module editor.actions - Defines the actions for
 *     the system view editing.
 */
import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ComponentTypeAPI } from "#api/component-type.api.ts";
import type {
    ComponentType,
    CreateComponentTypeRequest,
    UpdateComponentTypeRequest,
} from "#api/types/component-types.types.ts";

/**
 * Wrapper class the defines the functions
 * for the editor actions.
 */
export class EditorActions {
    /**
     * Action that selects a component.
     * @function selectComponent
     * @param {string} type - Action type.
     * @returns Action function for selecting a component.
     */
    static selectComponent = createAction("[editor] select component");

    /**
     * Action that deselects a component.
     * @function deselectComponent
     * @param {string} type - Action type.
     * @returns Action function for deselecting a component.
     */
    static deselectComponent = createAction("[editor] deselect component");

    /**
     * Action that creates a dotted connection line.
     * @function setConnection
     * @param {string} type - Action type.
     * @returns Action function for creating a dotted connection line.
     */
    static setConnection = createAction("[editor] set connection");

    /**
     * Action that resets a dotted connection line.
     * @function resetConnection
     * @param {string} type - Action type.
     * @returns Action function for resetting a dotted connection line.
     */
    static resetConnection = createAction("[editor] reset connection");

    static selectConnector = createAction("[editor] select connector");

    /**
     * Action that deselects a connector.
     * @function deselectConnection
     * @param {string} type - Action type.
     * @returns Action function for deselecting a connector.
     */
    static deselectConnector = createAction("[editor] deselect connector");

    /**
     * Action that selects a connection line.
     * @function selectConnection
     * @param {string} type - Action type.
     * @returns Action function for selecting a connection line.
     */
    static selectConnection = createAction("[editor] select connection");

    /**
     * Action that deselects a connection line.
     * @function deselectConnection
     * @param {string} type - Action type.
     * @returns Action function for deselecting a connection line.
     */
    static deselectConnection = createAction("[editor] deselect connection");

    /**
     * Action that centers the system view.
     * @function setLayerPosition
     * @param {string} type - Action type.
     * @returns Action function for centering the system view.
     */
    static setLayerPosition = createAction("[editor] set layer position");

    /**
     * Action that zooms the system view in and out.
     * @function setStageScale
     * @param {string} type - Action type.
     * @returns Action function for zooming the system view in and out.
     */
    static setStageScale = createAction("[editor] set stage scale");

    /**
     * Action that creates help lines when moving a component.
     * @function setShowHelpLines
     * @param {string} type - Action type.
     * @returns Action function for creating help lines when moving a component.
     */
    static setShowHelpLines = createAction("[editor] show help lines");

    /**
     * Action for selecting a point of attack.
     * @function selectPointOfAttack
     * @param {string} type - Action type.
     * @returns Action function for selecting a point of attack.
     */
    static selectPointOfAttack = createAction("[editor] select point of attack");

    /**
     * Action for deselecting a point of attack.
     * @function deselectPointOfAttack
     * @param {string} type - Action type.
     * @returns Action function for deselecting a point of attack.
     */
    static deselectPointOfAttack = createAction("[editor] deselect point of attack");

    /**
     * Action for selecting a connection interface.
     * @function selectConnectionPoint
     * @param {string} type - Action type.
     * @returns Action function for selecting a connection interface.
     */
    static selectConnectionPoint = createAction("[editor] select connection point");

    /**
     * Action for deselecting a connection interface.
     * @function deselectConnectionPoint
     * @param {string} type - Action type.
     * @returns Action function for deselecting a connection interface.
     */
    static deselectConnectionPoint = createAction("[editor] deselect connection point");

    static setMousePointer = createAction("[editor] set mouse pointer");

    /**
     * Action for searching for an asset at a component.
     * @function setAssetSearchValue
     * @param {string} type - Action type.
     * @returns Action function for searching an asset inside of a component.
     */
    static setAssetSearchValue = createAction("[editor] set asset search value");

    /**
     * Action when a user joins.
     * @function userJoined
     * @param {string} type - Action type.
     * @returns Action function for letting a user join.
     */
    static userJoined = createAction("[editor] user joined");

    /**
     * Action when a user leaves.
     * @function userLeft
     * @param {string} type - Action type.
     * @returns Action function for letting a user leave.
     */
    static userLeft = createAction("[editor] user left");

    /**
     * Action when a user opens the context menu of a component.
     * @function setOpenContextMenu
     * @param {string} type - Action type.
     * @returns Action function for opening the context menu of a component.
     */
    static setOpenContextMenu = createAction("[editor] set open context menu");

    /**
     * Action for adding a component to the system view.
     * @function addComponentType
     * @param {string} type - Action type.
     * @returns Action function for adding a component to the system view.
     */
    static addComponentType = createAction("[editor] add component type");

    static setComponentType = createAction("[editor] set component type");

    /**
     * Action for removing a component from the system view.
     * @function removeComponentType
     * @param {string} type - Action type.
     * @returns Action function for removing a component from the system view.
     */
    static removeComponentType = createAction("[editor] remove component type");

    /**
     * Action that gets the components using the backend api.
     * @function getComponentTypes
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to get the components.
     * @returns Action function for getting the components.
     */
    static getComponentTypes = createAsyncThunk("[editor] get component types", async (data: { projectId: number }) => {
        return await ComponentTypeAPI.getComponentTypes(data);
    });

    /**
     * Action that creates a component using the backend api.
     * @function createComponentType
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create a component.
     * @returns Action function for creating a component.
     */
    static createComponentType = createAsyncThunk(
        "[editor] create component type",
        async (data: CreateComponentTypeRequest) => {
            return await ComponentTypeAPI.createComponentType(data);
        }
    );

    /**
     * Action that updates a component using the backend api.
     * @function updateComponentType
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update a component.
     * @returns Action function for updating a component.
     */
    static updateComponentType = createAsyncThunk(
        "[editor] update component type",
        async (data: UpdateComponentTypeRequest) => {
            return await ComponentTypeAPI.updateComponentType(data);
        }
    );

    /**
     * Action that deletes a component using the backend api.
     * @function deleteComponentType
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to delete a component.
     * @returns Action function for deleting a component.
     */
    static deleteComponentType = createAsyncThunk("[editor] delete component type", async (data: ComponentType) => {
        await ComponentTypeAPI.deleteComponentType(data);
        return data;
    });

    static addComponentConnectionLine = createAction("[editor] create component connection line");
    static removeComponentConnectionLine = createAction("[editor] remove component connection line");
    static clearComponentConnectionLines = createAction("[editor] clear component connection lines");

    /**
     * Action for adding an already in use component in the editor e.g when dragging it.
     * @function addInUseComponent
     * @param {string} type - Action type.
     * @returns Action function for adding a used component.
     */
    static addInUseComponent = createAction("[editor] add in-use-component");

    static removeInUseComponent = createAction("[editor] remove in-use-component");

    /**
     * Action for setting the auto save status.
     * @function setAutoSaveStatus
     * @param {string} type - Action type.
     * @returns Action function for setting the auto save status.
     */
    static setAutoSaveStatus = createAction("[editor] set auto save status");

    /**
     * Action for setting the auto save text.
     * @function setAutoSaveText
     * @param {string} type - Action type.
     * @returns Action function for setting the auto save text.
     */
    static setAutoSaveText = createAction("[editor] set auto save text");

    /**
     * Action for setting the last auto save date.
     * @function setLastAutoSaveDate
     * @param {string} type - Action type.
     * @returns Action function for setting the last auto save date.
     */
    static setLastAutoSaveDate = createAction("[editor] set last auto save date");

    /**
     * Action for making a screenshot of the system view.
     * @function makeAScreenshot
     * @param {string} type - Action type.
     * @returns Action function for making a screenshot of the system view.
     */
    static makeAScreenshot = createAction("[editor] make a screenshot");
}
