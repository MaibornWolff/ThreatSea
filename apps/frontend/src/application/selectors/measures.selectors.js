/**
 * @module measures.selectors - Defines
 *     selectors for the measures.
 */

import { createSelector } from "@reduxjs/toolkit";
import { measuresAdapter } from "../adapters/measures.adapter";

/**
 * Wrapper object for the selectors
 * of the measures.
 */
const measuresSelectors = {
    selectByProjectId: createSelector(
        [(state) => state.measures.entities, (state, projectId) => projectId],
        (entities, projectId) => {
            return Object.values(entities).filter((item) => item.projectId === projectId);
        }
    ),

    selectAll: measuresAdapter.getSelectors().selectAll,
};

export default measuresSelectors;
