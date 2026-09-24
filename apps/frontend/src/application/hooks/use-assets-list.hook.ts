import { useEffect, useMemo } from "react";
import type { Asset } from "#api/types/asset.types.ts";
import { useAssets } from "./use-assets.hook";

export const useAssetsList = ({ projectId }: { projectId: number }) => {
    const { isPending, items, loadAssets, deleteAsset } = useAssets({
        projectId,
    });

    useEffect(() => {
        loadAssets();
    }, [projectId, loadAssets]);

    // Deterministic initial order; searching and per-column sorting are handled by the data grid.
    const sortedItems = useMemo(
        () => items.toSorted((a: Asset, b: Asset) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
        [items]
    );

    return {
        deleteAsset,
        isPending,
        assets: sortedItems,
    };
};
