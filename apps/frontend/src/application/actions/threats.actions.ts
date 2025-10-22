/**
 * @module threats.actions - Defines the actions
 *     for the threat view.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { ThreatsAPI } from "#api/threats.api.ts";
import type { CreateThreatRequest, ExtendedThreat, Threat, UpdateThreatRequest } from "#api/types/threat.types.ts";

/**
 * Wrapper class for the threat view actions.
 */
export class ThreatsActions {
    /**
     * Action that gets the threats using the backend api.
     * @function getThreats
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the threats.
     * @returns Action function for getting the threats.
     */
    static getThreats = createAsyncThunk("[threats] get threats", async (data: { projectId: number }) => {
        return await ThreatsAPI.getThreats(data);
    });

    /**
     * Action that creates a threat using the backend api.
     * @function createThreats
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create a threat.
     * @returns Action function for creating a threat.
     */
    static createThreat = createAsyncThunk("[threat] create threat", async (data: CreateThreatRequest) => {
        return await ThreatsAPI.createThreat(data);
    });

    /**
     * Action that updates a threat using the backend api.
     * @function updateThreat
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update a threat.
     * @returns Action function for updating a threat.
     */
    static updateThreat = createAsyncThunk("[threat] update threat", async (data: UpdateThreatRequest) => {
        return await ThreatsAPI.updateThreat(data);
    });

    /**
     * Action that deletes a threat using the backend api.
     * @function deleteThreat
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to delete a threat.
     * @returns Action function for deleting a threat.
     */
    static deleteThreat = createAsyncThunk("[threat] delete threat", async (data: Threat) => {
        await ThreatsAPI.deleteThreat(data);
        return data;
    });

    /**
     * Action that sets a threat.
     * @function setThreat
     * @param {string} type - Action type.
     * @returns Action function for setting/changing a threat.
     */
    static setThreat = createAction<ExtendedThreat>("[threats] set threat");

    /**
     * Action that removes a threat.
     * @function removeThreat
     * @param {string} type - Action type.
     * @returns Action function for removing a threat.
     */
    static removeThreat = createAction<ExtendedThreat>("[threats] remove threat");
}
