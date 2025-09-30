/**
 * @module measures.actions - Defines the actions
 *     for the measures under the risk page.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { MeasuresAPI } from "#api/measures.api.ts";
import type { CreateMeasureRequest, Measure, UpdateMeasureRequest } from "#api/types/measure.types.ts";

/**
 * Wrapper class to expose the actions through
 * static functions.
 */
export class MeasuresActions {
    /**
     * Action that gets the measures using the backend
     * with the api.
     * @function getMeasures
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the measures.
     * @returns Action function for getting the measures.
     */
    static getMeasures = createAsyncThunk("[measures] get measures", async (data: { projectId: number }) => {
        return await MeasuresAPI.getMeasures(data);
    });

    /**
     * Action that creates a measure using the backend
     * with the api.
     * @function createMeasure
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create a measure.
     * @returns Action function for creating a measure.
     */
    static createMeasure = createAsyncThunk("[measures] create measures", async (data: CreateMeasureRequest) => {
        return await MeasuresAPI.createMeasure(data);
    });

    /**
     * Action that updates a measure using the backend
     * with the api.
     * @function updateMeasure
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update a measure.
     * @returns Action function for updating a measure.
     */
    static updateMeasure = createAsyncThunk("[measures] update measures", async (data: UpdateMeasureRequest) => {
        return await MeasuresAPI.updateMeasure(data);
    });

    /**
     * Action that deletes a measure using the backend
     * with the api.
     * @function deleteMeasure
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to delete a measure.
     * @returns Action function for deleting a measure.
     */
    static deleteMeasure = createAsyncThunk("[measures] delete measures", async (data: Measure) => {
        await MeasuresAPI.deleteMeasure(data);
        return data;
    });

    /**
     * Action that changes a measure with new data.
     * @function setMeasure
     * @param {string} type - Action type.
     * @returns Action function for changing a measure.
     */
    static setMeasure = createAction("[measures] set measures");

    /**
     * Action that removes a measure.
     * @function removeMeasure
     * @param {string} type - Action type.
     * @returns Action function for removing a measure.
     */
    static removeMeasure = createAction("[measures] remove measures");

    /**
     * Action that resets a measure.
     * @function resetMeasure
     * @param {string} type - Action type.
     * @returns Action function for resetting a measure.
     */
    static resetMeasure = createAction("[measure] reset measures");
}
