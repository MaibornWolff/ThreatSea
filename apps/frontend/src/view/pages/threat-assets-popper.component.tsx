import { Popper } from "@mui/material";
import type { ExtendedThreat } from "#api/types/threat.types.ts";

interface ThreatAssetsPopperProps {
    anchorEl: HTMLElement | null;
    assets: ExtendedThreat["assets"] | null;
}

/**
 * Lists a threat's assets with their C/I/A ratings next to the hovered assets cell.
 */
export const ThreatAssetsPopper = ({ anchorEl, assets }: ThreatAssetsPopperProps) => (
    <Popper
        open={anchorEl != null}
        anchorEl={anchorEl}
        placement="bottom-start"
        sx={{
            backgroundColor: "background.defaultIntransparent",
            borderRadius: 5,
            boxShadow: 1,
        }}
    >
        <ul
            style={{
                listStyleType: "none",
                textAlign: "left",
                padding: 8,
                margin: 4,
            }}
        >
            {assets?.map((asset) => (
                <li key={asset.id}>
                    {asset.name +
                        " (C " +
                        asset.confidentiality +
                        " / I " +
                        asset.integrity +
                        " / A " +
                        asset.availability +
                        ")"}
                </li>
            ))}
        </ul>
    </Popper>
);
