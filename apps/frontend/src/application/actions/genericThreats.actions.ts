import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";

export class GenericThreatsActions {
    static loadGenericThreats = createAsyncThunk(
        "[genericThreats] load generic threats",
        async (data: { projectId: number }) => {
            return await GenericThreatsAPI.getGenericThreatsWithExtendedChildren(data);
        }
    );

    // Placeholder create/update/delete thunks. Backend does not expose public create/update/delete
    // endpoints for genericThreats in the frontend API yet. These thunks return the payload so
    // the dialogs middleware and callers can be wired and tested; replace with real API calls
    // if/when endpoints are added.
    static createGenericThreat = createAsyncThunk(
        "[genericThreats] create generic threat",
        async (data: Partial<GenericThreatWithExtendedChildren>) => {
            return data as GenericThreatWithExtendedChildren;
        }
    );

    static updateGenericThreat = createAsyncThunk(
        "[genericThreats] update generic threat",
        async (data: GenericThreatWithExtendedChildren) => {
            return data;
        }
    );

    static deleteGenericThreat = createAsyncThunk(
        "[genericThreats] delete generic threat",
        async (data: GenericThreatWithExtendedChildren) => {
            return data;
        }
    );

    static setGenericThreat = createAction<GenericThreatWithExtendedChildren>("[genericThreats] set generic threat");
}

export default GenericThreatsActions;
