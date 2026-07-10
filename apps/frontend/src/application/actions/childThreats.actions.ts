import { createAsyncThunk } from "@reduxjs/toolkit";
import { ChildThreatsAPI } from "#api/child-threats.api.ts";
import type { CreateChildThreatRequest, UpdateChildThreatRequest } from "#api/types/child-threat.types.ts";

export class ChildThreatsActions {
    static createChildThreat = createAsyncThunk(
        "[childThreats] create child threat",
        async (data: CreateChildThreatRequest) => {
            return await ChildThreatsAPI.createChildThreat(data);
        }
    );

    static updateChildThreat = createAsyncThunk(
        "[childThreats] update child threat",
        async (data: UpdateChildThreatRequest) => {
            return await ChildThreatsAPI.updateChildThreat(data);
        }
    );

    static deleteChildThreat = createAsyncThunk(
        "[childThreats] delete child threat",
        async (data: { id: number; projectId: number }) => {
            await ChildThreatsAPI.deleteChildThreat(data);
            return data;
        }
    );
}
