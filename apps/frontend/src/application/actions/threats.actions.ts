import { createAsyncThunk } from "@reduxjs/toolkit";
import { GenericThreatsAPI } from "#api/generic-threats.api.ts";
import { ThreatsAPI } from "#api/threats.api.ts";
import type { CreateThreatRequest, ExtendedThreat, UpdateThreatRequest } from "#api/types/threat.types.ts";

export class ThreatsActions {
    // Loads a project's threats into the store shared by every useThreats instance. A load for a
    // project that is already loading is skipped, so several consumers mounting together share
    // one request.
    static getThreats = createAsyncThunk(
        "[threats] get threats",
        async ({ projectId }: { projectId: number }): Promise<ExtendedThreat[]> => {
            const genericThreats = await GenericThreatsAPI.getGenericThreatsWithExtendedThreats({ projectId });
            return genericThreats.flatMap((genericThreat) => genericThreat.threats);
        },
        {
            condition: ({ projectId }, { getState }) => {
                const { threats } = getState() as { threats: { pendingProjectId: number | null } };
                return threats.pendingProjectId !== projectId;
            },
        }
    );

    static createThreat = createAsyncThunk("[threats] create threat", async (data: CreateThreatRequest) => {
        return await ThreatsAPI.createThreat(data);
    });

    static updateThreat = createAsyncThunk("[threats] update threat", async (data: UpdateThreatRequest) => {
        return await ThreatsAPI.updateThreat(data);
    });

    // The name is not sent to the backend; it is carried through for the success/failure alerts.
    static deleteThreat = createAsyncThunk(
        "[threats] delete threat",
        async (data: { id: number; projectId: number; name: string }) => {
            await ThreatsAPI.deleteThreat(data);
            return data;
        }
    );
}
