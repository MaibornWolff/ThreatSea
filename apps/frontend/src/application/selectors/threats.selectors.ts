import { createSelector } from "reselect";
import type { RootState } from "#application/store.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { threatAdapter } from "../adapters/threats.adapter";

const selectThreatEntities = (state: RootState) => state.threats.entities;
const selectProjectId = (_state: RootState, projectId: number) => projectId;

export const threatsSelectors = {
    selectByProjectId: createSelector(
        [selectThreatEntities, selectProjectId],
        (entities, projectId): ExtendedThreat[] => {
            return Object.values(entities).filter((item) => item.projectId === projectId);
        }
    ),

    selectAll: threatAdapter.getSelectors((state: RootState) => state.threats).selectAll,
};
