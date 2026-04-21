import { FormControlLabel, FormGroup, Switch, Typography } from "@mui/material";
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
}: EditorSidebarAssetListProps) => {
    return (
        <FormGroup sx={{ color: "text.primary", paddingLeft: 0.5 }}>
            {items.map((asset, index) => {
                return (
                    <FormControlLabel
                        key={index}
                        control={
                            <Switch
                                checked={checkedAssets.includes(asset.id)}
                                onChange={(e) => onChangeHandler(e, asset)}
                                size="small"
                                sx={{
                                    "& .MuiSwitch-switchBase": {
                                        "&.Mui-checked": {
                                            "& + .MuiSwitch-track": {
                                                backgroundColor: "#546481",
                                                opacity: 0.8,
                                            },
                                        },
                                    },
                                }}
                            />
                        }
                        label={
                            <Typography
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onAssetNameClick(asset);
                                }}
                                onMouseEnter={(e) => onAssetHover(e, asset)}
                                onMouseLeave={onAssetLeave}
                                sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: "bold",
                                    marginLeft: 1,
                                    cursor: "pointer",
                                    "&:hover": { textDecoration: "underline" },
                                }}
                                data-testid="asset-search-results"
                            >
                                {asset.name}
                            </Typography>
                        }
                    />
                );
            })}
        </FormGroup>
    );
};
