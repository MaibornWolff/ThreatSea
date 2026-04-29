import { Box, FormGroup, Switch, Typography } from "@mui/material";
import type { ChangeEvent, MouseEvent } from "react";
import type { Asset } from "#api/types/asset.types.ts";

export interface EditorSidebarAssetListProps {
    items: Asset[];
    checkedAssets: number[];
    onChangeHandler: (event: ChangeEvent<HTMLInputElement>, asset: Asset) => void;
    onAssetNameClick: (asset: Asset) => void;
    onAssetHover: (event: MouseEvent<HTMLElement>, asset: Asset) => void;
    onAssetLeave: () => void;
}

export const EditorSidebarAssetList = ({
    items,
    checkedAssets,
    onChangeHandler,
    onAssetNameClick,
    onAssetHover,
    onAssetLeave,
}: EditorSidebarAssetListProps) => (
    <FormGroup sx={{ color: "text.primary", paddingLeft: 0.5 }}>
        {items.map((asset, index) => (
            <Box
                key={index}
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    color: "text.primary",
                    marginLeft: "-11px",
                }}
            >
                <Switch
                    checked={checkedAssets.includes(asset.id)}
                    onChange={(e) => onChangeHandler(e, asset)}
                    size="small"
                    slotProps={{ input: { role: "switch", "aria-label": asset.name } }}
                    sx={{
                        "& .MuiSwitch-switchBase": {
                            "&.Mui-checked": {
                                "& + .MuiSwitch-track": { backgroundColor: "#546481", opacity: 0.8 },
                            },
                        },
                    }}
                />
                <Typography
                    component="span"
                    onClick={() => onAssetNameClick(asset)}
                    onMouseEnter={(e) => onAssetHover(e, asset)}
                    onMouseLeave={onAssetLeave}
                    data-testid="asset-search-results"
                    sx={{
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        marginLeft: 1,
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                    }}
                >
                    {asset.name}
                </Typography>
            </Box>
        ))}
    </FormGroup>
);
