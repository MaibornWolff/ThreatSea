import { useCallback } from "react";
import { AssetsActions } from "../actions/assets.actions";
import { assetsSelectors } from "../selectors/assets.selectors";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";
import type { Asset } from "#api/types/asset.types.ts";

export const useAssets = ({ projectId }: { projectId: number }) => {
    const dispatch = useAppDispatch();

    // Items is an array of assets and pending the flag if an api request is still going.
    const items = useAppSelector((state) => assetsSelectors.selectByProjectId(state, projectId));
    const isPending = useAppSelector((state) => state.assets.isPending);

    const loadAssets = useCallback(() => {
        dispatch(AssetsActions.getAssets({ projectId }));
    }, [projectId, dispatch]);

    const deleteAsset = (asset: Asset) => {
        dispatch(AssetsActions.deleteAsset(asset));
    };

    return {
        items,
        isPending,
        loadAssets,
        deleteAsset,
    };
};
