import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "#application/store.ts";
import type { Measure } from "#api/types/measure.types.ts";
import { measuresAdapter } from "#application/adapters/measures.adapter.ts";

const selectMeasuresEntities = (state: RootState) => state.measures.entities;
const selectProjectId = (_state: RootState, projectId: number) => projectId;

export const measuresSelectors = {
    selectByProjectId: createSelector([selectMeasuresEntities, selectProjectId], (entities, projectId): Measure[] => {
        return Object.values(entities).filter((item) => item.projectId === projectId);
    }),

    selectAll: measuresAdapter.getSelectors((state: RootState) => state.measures).selectAll,
};
