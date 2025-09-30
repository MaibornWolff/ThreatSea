/**
 * @module threats.selectors - Defines
 *     selectors for the threats.
 */

import { threatAdapter } from "../adapters/threats.adapter";
import { createSelector } from "reselect";

const threatsSelectors = {
    selectByProjectId: createSelector(
        [(state) => state.threats.entities, (state, projectId) => projectId],
        (entities, projectId) => {
            return Object.values(entities).filter((item) => item.projectId === projectId);
        }
    ),

    selectAll: threatAdapter.getSelectors().selectAll,
};

export default threatsSelectors;
