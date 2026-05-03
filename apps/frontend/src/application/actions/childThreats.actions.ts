import { createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { ChildThreatsAPI } from "#api/child-threats.api.ts";
import type { ChildThreat, ExtendedChildThreat } from "#api/types/child-threat.types.ts";

export class ChildThreatsActions {
    static getChildThreats = createAsyncThunk(
        "[childThreats] get child threats",
        async (data: { projectId: number; genericThreatId: number }) => {
            return await ChildThreatsAPI.getChildThreatsByGenericThreat(data);
        }
    );

    static createChildThreat = createAsyncThunk(
        "[childThreats] create child threat",
        async (data: { projectId: number; genericThreatId: number; [key: string]: any }) => {
            return await ChildThreatsAPI.createChildThreat(data);
        }
    );

    static updateChildThreat = createAsyncThunk(
        "[childThreats] update child threat",
        async (data: { id: number; projectId: number; genericThreatId?: number; [key: string]: any }) => {
            return await ChildThreatsAPI.updateChildThreat(data);
        }
    );

    static deleteChildThreat = createAsyncThunk(
        "[childThreats] delete child threat",
        async (data: { id: number; projectId: number; genericThreatId?: number }) => {
            await ChildThreatsAPI.deleteChildThreat(data);
            return data;
        }
    );

    static setChildThreat = createAction<ChildThreat | ExtendedChildThreat>("[childThreats] set child threat");
}

export default ChildThreatsActions;
