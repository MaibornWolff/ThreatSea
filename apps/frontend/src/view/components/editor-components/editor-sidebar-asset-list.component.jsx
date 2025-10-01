import { FormControlLabel, FormGroup, Switch, Typography } from "@mui/material";

export const EditorSidebarAssetList = ({ items, checkedAssets, onChangeHandler }) => {
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
                                sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: "bold",
                                    marginLeft: 1,
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
