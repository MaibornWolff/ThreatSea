import { createSelector } from "reselect";
import type { RootState } from "#application/store.ts";
import type { Asset } from "#api/types/asset.types.ts";
import { assetsAdapter } from "../adapters/asset.adapter";

const selectAssetsEntities = (state: RootState) => state.assets.entities;
const selectProjectId = (_state: RootState, projectId: number) => projectId;

export const assetsSelectors = {
    selectByProjectId: createSelector([selectAssetsEntities, selectProjectId], (entities, projectId): Asset[] => {
        return Object.values(entities).filter((item) => item.projectId === projectId);
    }),

    selectAll: assetsAdapter.getSelectors((state: RootState) => state.assets).selectAll,
};
