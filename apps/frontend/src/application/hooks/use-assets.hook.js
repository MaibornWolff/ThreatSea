/**
 * @module use-asset.hook - Custom hook
 *     for the assets.
 */

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AssetsActions } from "../actions/assets.actions";
import assetsSelectors from "../selectors/assets.selectors";

/**
 * Creates a custom overall hook for the assets.
 * @param {number} projectId - id of the current project.
 * @returns Asset hook.
 */
export const useAssets = ({ projectId }) => {
    const dispatch = useDispatch();

    // Items is an array of assets and pending the flag if an api request is still going.
    const items = useSelector((state) => assetsSelectors.selectByProjectId(state, projectId));
    const isPending = useSelector((state) => state.assets.isPending);

    /**
     * Fetches the assets when the page is loaded.
     */
    const loadAssets = useCallback(() => {
        dispatch(AssetsActions.getAssets({ projectId }));
    }, [projectId, dispatch]);

    /**
     * Deletes the specified asset from the items list.
     * @param {object} asset - Data of the asset.
     */
    const deleteAsset = (asset) => {
        dispatch(AssetsActions.deleteAsset(asset));
    };

    return {
        items,
        isPending,
        loadAssets,
        deleteAsset,
    };
};
