/**
 * @module measureImpacts.actions - Defines the actions
 *     for the measures under the risk page.
 */
import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { MeasureImpactsApi } from "#api/measureImpacts.api.ts";
import type {
    CreateMeasureImpactRequest,
    MeasureImpact,
    UpdateMeasureImpactRequest,
} from "#api/types/measure-impact.types.ts";

/**
 * Wrapper class to expose the actions through
 * static functions.
 */
export class MeasureImpactsActions {
    /**
     * Action that gets the measures using the backend
     * with the api.
     * @function getMeasures
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to fetch the measures.
     * @returns Action function for getting the measures.
     */
    static getMeasureImpacts = createAsyncThunk(
        "[measureImpacts] get measureImpacts",
        async (data: { projectId: number }) => {
            return await MeasureImpactsApi.getMeasureImpacts(data);
        }
    );

    /**
     * Action that creates a measure using the backend
     * with the api.
     * @function createMeasure
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to create a measure.
     * @returns Action function for creating a measure.
     */
    static createMeasureImpact = createAsyncThunk(
        "[measureImpacts] create measureImpact",
        async (data: CreateMeasureImpactRequest) => {
            return await MeasureImpactsApi.createMeasureImpact(data);
        }
    );

    /**
     * Action that updates a measure using the backend
     * with the api.
     * @function updateMeasure
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to update a measure.
     * @returns Action function for updating a measure.
     */
    static updateMeasureImpact = createAsyncThunk(
        "[measureImpacts] update measureImpact",
        async (data: UpdateMeasureImpactRequest) => {
            return await MeasureImpactsApi.updateMeasureImpact(data);
        }
    );

    /**
     * Action that deletes a measure using the backend
     * with the api.
     * @function deleteMeasure
     * @param {string} type - Action type.
     * @param {function} payloadCreator - Async callback function
     *      to delete a measure.
     * @returns Action function for deleting a measure.
     */
    static deleteMeasureImpact = createAsyncThunk(
        "[measureImpacts] delete measureImpact",
        async (data: MeasureImpact) => {
            await MeasureImpactsApi.deleteMeasureImpact(data);
            return data;
        }
    );

    /**
     * Action that changes a measure with new data.
     * @function setMeasure
     * @param {string} type - Action type.
     * @returns Action function for changing a measure.
     */
    static setMeasureImpact = createAction("[measureImpacts] set measureImpact");

    /**
     * Action that removes a measure.
     * @function removeMeasure
     * @param {string} type - Action type.
     * @returns Action function for removing a measure.
     */
    static removeMeasureImpact = createAction("[measureImpacts] remove measureImpact");

    /**
     * Action that resets a measure.
     * @function resetMeasure
     * @param {string} type - Action type.
     * @returns Action function for resetting a measure.
     */
    static resetMeasureImpact = createAction("[measureImpacts] reset measureImpacts");
}
