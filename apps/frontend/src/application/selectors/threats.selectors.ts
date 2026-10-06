import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "#application/store.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { threatAdapter } from "#application/adapters/threats.adapter.ts";

const { selectAll } = threatAdapter.getSelectors((state: RootState) => state.threats);
const selectProjectId = (_state: RootState, projectId: number) => projectId;

export const threatsSelectors = {
    // sorted by name, like the adapter
    selectByProjectId: createSelector([selectAll, selectProjectId], (threats, projectId): ExtendedThreat[] =>
        threats.filter((threat) => threat.projectId === projectId)
    ),
};
