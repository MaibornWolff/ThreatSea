/**
 * @module assets.selectors - Defines selector functions
 *     for the assets.
 */

import { assetsAdapter } from "../adapters/asset.adapter";
import { createSelector } from "reselect";

const assestSelectors = {
    selectByProjectId: createSelector(
        [(state) => state.assets.entities, (state, projectId) => projectId],
        (entities, projectId) => {
            return Object.values(entities).filter((item) => item.projectId === projectId);
        }
    ),

    selectAll: assetsAdapter.getSelectors().selectAll,
};

export default assestSelectors;
