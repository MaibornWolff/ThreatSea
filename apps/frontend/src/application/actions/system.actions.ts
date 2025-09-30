/**
 * @module systems.actions - Defines the actions
 *     for the system view.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { SystemAPI } from "#api/system.api.ts";
import type { UpdateSystemRequest } from "#api/types/system.types.ts";

/**
 * Wrapper class that defines the actions functions
 * for the system actions.
 */
export class SystemActions {
    /**
     * Action that gets the system using the backend api.
     * @function getSystem
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the system view.
     * @returns Action function for getting the system view.
     */
    static getSystem = createAsyncThunk("[system] get system", async (data: { projectId: number }) => {
        return await SystemAPI.getSystem(data);
    });

    static clearSystem = createAction("[system] clear system");

    /**
     * Action that updates the system using the backend api.
     * @function updateSystem
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update the system view.
     * @returns Action function for updating the system view.
     */
    static updateSystem = createAsyncThunk("[system] update system", async (data: UpdateSystemRequest) => {
        return await SystemAPI.updateSystem(data);
    });

    /**
     * Action that saves the system view.
     * @function saveSystem
     * @param {string} type - Action type.
     * @returns Action function for saving the system view.
     */
    static saveSystem = createAction("[system] save system");

    /**
     * Action that sets a component in the system view when its dragged.
     * @function setComponents
     * @param {string} type - Action type.
     * @returns Action function for setting a component in the system view.
     */
    static setComponents = createAction("[system] set components");

    /**
     * Action that sets a connection line in the system view.
     * @function setConnections
     * @param {string} type - Action type.
     * @returns Action function for setting a connection line in the system view.
     */
    static setConnections = createAction("[system] set connections");

    /**
     * Action that sets the pending state of a request.
     * @function setPendingState
     * @param {string} type - Action type.
     * @returns Action function for setting the pending state of a request.
     */
    static setPendingState = createAction("[system] set pending state");

    /**
     * Action that creates a component in the system view.
     * @function createComponent
     * @param {string} type - Action type.
     * @returns Action function for creating a component in the system view.
     */
    static createComponent = createAction("[system] create component");

    /**
     * Action that creates a connection line in the system view.
     * @function createConnection
     * @param {string} type - Action type.
     * @returns Action function for creating a connection line in the system view.
     */
    static createConnection = createAction("[system] create connection");

    /**
     * Action that removes a component in the system view.
     * @function removeComponent
     * @param {string} type - Action type.
     * @returns Action function for removing a component in the system view.
     */
    static removeComponent = createAction("[system] remove component");

    /**
     * Action that sets the name of a component.
     * @function setComponentName
     * @param {string} type - Action type.
     * @returns Action function for setting the name of a component.
     */
    static setComponentName = createAction("[system] set component name");

    /**
     * Action that creates a connection point in the system view.
     * @function createConnectionPoint
     * @param {string} type - Action type.
     * @returns Action function for creating a connection point in the system view.
     */
    static createConnectionPoint = createAction("[system] create connection point");

    /**
     * Action that changes a connection line in the system view when its dragged.
     * @function setConnectionPoint
     * @param {string} type - Action type.
     * @returns Action function for changing a connection line in the system view.
     */
    static setConnectionPoint = createAction("[system] set connection point");

    /**
     * Action that removes a connection point in the system view.
     * @function removeConnectionPoint
     * @param {string} type - Action type.
     * @returns Action function for removing a connection point in the system view.
     */
    static removeConnectionPoint = createAction("[system] remove connection point");

    /**
     * Action that creates a connection line in the system view.
     * @function removeConnection
     * @param {string} type - Action type.
     * @returns Action function for creating a connection line in the system view.
     */
    static removeConnection = createAction("[editor] remove connection");

    /**
     * Action that refreshes a system.
     * @function refresh
     * @param {string} type - Action type.
     * @returns Action function for refreshing a system.
     */
    static refresh = createAction("[editor] refresh");

    /**
     * Action that sets a component in the system.
     * @function setComponent
     * @param {string} type - Action type.
     * @returns Action function for setting a component in the system.
     */
    static setComponent = createAction("[system] set component");

    /**
     * Action that sets a connection line in the system.
     * @function setConnection
     * @param {string} type - Action type.
     * @returns Action function for setting a connection line in the system.
     */
    static setConnection = createAction("[system] set connection");

    /**
     * Action that indicates a system change.
     * @function setHasChanged
     * @param {string} type - Action type.
     * @returns Action function for indicating a system change
     */
    static setHasChanged = createAction("[system] set has changed");

    /**
     * Action that sets the id of the system. Each system view is different
     * for every user that has joined
     * @function setSystemId
     * @param {string} type - Action type.
     * @returns Action function for setting the system id.
     */
    static setSystemId = createAction("[system] set system id");

    /**
     * Action that indicates that the auto save is blocked.
     * @function autoSavedBlocked
     * @param {string} type - Action type.
     * @returns Action function for indicating that the auto save is blocked.
     */
    static autoSavedBlocked = createAction("[system] auto save blocked");

    /**
     * Action that sets the auto save to blocked.
     * @function setAutoSavedBlocked
     * @param {string} type - Action type.
     * @returns Action function for setting the auto save to blocked.
     */
    static setAutoSavedBlocked = createAction("[system] set auto save blocked");

    /**
     * Action that indicates that the system is properly initialised.
     * @function setInitialized
     * @param {string} type - Action type.
     * @returns Action function for indicating that the system is initialised.
     */
    static setInitialized = createAction("[system] set initialized");

    /**
     * Action that sets the connection points in the system view
     * @function setConnectionPoints
     * @param {string} type - Action type.
     * @returns Action function for changing the connection points.
     */
    static setConnectionPoints = createAction("[sysetm] set connection points");
}
