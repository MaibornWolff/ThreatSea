import { createAsyncThunk } from "@reduxjs/toolkit";
import { ThreatsAPI } from "#api/threats.api.ts";
import type { CreateThreatRequest, UpdateThreatRequest } from "#api/types/threat.types.ts";

export class ThreatsActions {
    static createThreat = createAsyncThunk("[threats] create child threat", async (data: CreateThreatRequest) => {
        return await ThreatsAPI.createThreat(data);
    });

    static updateThreat = createAsyncThunk("[threats] update child threat", async (data: UpdateThreatRequest) => {
        return await ThreatsAPI.updateThreat(data);
    });

    static deleteThreat = createAsyncThunk(
        "[threats] delete child threat",
        async (data: { id: number; projectId: number }) => {
            await ThreatsAPI.deleteThreat(data);
            return data;
        }
    );
}
