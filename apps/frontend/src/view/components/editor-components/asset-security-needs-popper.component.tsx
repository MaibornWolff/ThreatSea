import { Popper, Typography, Box } from "@mui/material";
import type { Asset } from "#api/types/asset.types.ts";

export interface AssetSecurityNeedsPopperProps {
    anchorEl: HTMLElement | null;
    asset: Asset | null;
}

export const AssetSecurityNeedsPopper = ({ anchorEl, asset }: AssetSecurityNeedsPopperProps) => {
    return (
        <Popper
            open={anchorEl != null}
            anchorEl={anchorEl}
            placement="bottom-start"
            sx={{
                backgroundColor: "background.defaultIntransparent",
                borderRadius: 5,
                boxShadow: 1,
                zIndex: 1000,
            }}
        >
            {asset && (
                <Box sx={{ padding: 1, margin: 0.5 }}>
                    <Typography sx={{ fontSize: "0.75rem" }}>
                        {`(C ${asset.confidentiality} / I ${asset.integrity} / A ${asset.availability})`}
                    </Typography>
                </Box>
            )}
        </Popper>
    );
};
