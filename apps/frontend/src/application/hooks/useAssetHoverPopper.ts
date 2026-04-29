import { useState } from "react";
import type { MouseEvent } from "react";
import type { Asset } from "#api/types/asset.types.ts";

export const useAssetHoverPopper = () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [hoveredAsset, setHoveredAsset] = useState<Asset | null>(null);

    const handleAssetHover = (event: MouseEvent<HTMLElement>, asset: Asset) => {
        setHoveredAsset(asset);
        setAnchorEl(event.currentTarget);
    };

    const handleAssetLeave = () => {
        setHoveredAsset(null);
        setAnchorEl(null);
    };

    return { anchorEl, hoveredAsset, handleAssetHover, handleAssetLeave };
};
