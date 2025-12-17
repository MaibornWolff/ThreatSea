import { Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useTranslation } from "react-i18next";
import { EditorSidebarAssetList } from "./editor-sidebar-asset-list.component";
import { SearchField } from "../search-field.component";
import type { ChangeEvent } from "react";
import type { Asset } from "#api/types/asset.types.ts";
import type { SystemComponent, SystemPointOfAttack } from "#api/types/system.types.ts";

interface EditorSidebarSelectedPointOfAttackProps {
    selectedComponent: SystemComponent & { pointsOfAttack?: SystemPointOfAttack[] };
    selectedPointOfAttack: SystemPointOfAttack;
    assetSearchValue: string;
    handleAssetSearchChanged: (event: ChangeEvent<HTMLInputElement>) => void;
    items: Asset[];
    handleOnAssetChanged: (event: ChangeEvent<HTMLInputElement>, asset: Asset) => void;
}

export const EditorSidebarSelectedPointOfAttack = ({
    selectedComponent,
    selectedPointOfAttack,
    assetSearchValue,
    handleAssetSearchChanged,
    items,
    handleOnAssetChanged,
}: EditorSidebarSelectedPointOfAttackProps) => {
    const { t } = useTranslation("editorPage");
    return (
        <>
            <Box>
                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#f2f4f500",
                        paddingLeft: 0,
                        paddingRight: 0,
                        alignItems: "flex-start",
                        marginBottom: "-10px",
                        height: "26px",
                        border: "none",
                    }}
                >
                    <Typography
                        sx={{
                            display: "inline",
                            marginTop: "-0.5px",
                            fontWeight: "bold",
                            fontSize: "0.875rem",
                            color: "text.primary",
                            border: "none",
                        }}
                    >
                        {selectedComponent.name}
                        <Typography sx={{ display: "inline", marginLeft: 1, marginRight: 1 }}>&gt;</Typography>
                        {t(`pointsOfAttackList.${selectedPointOfAttack.type}`)}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#fff",
                        borderRadius: 15,
                        height: "31px",
                        paddingLeft: 8,
                        paddingRight: 0,
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 4,
                        marginBottom: 2,
                        marginLeft: -8,
                        marginRight: -8,
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                            color: "text.primary",
                        }}
                    >
                        {t("sidebar.assets.title")}
                    </Typography>
                </Box>

                <SearchField
                    sx={{
                        marginBottom: 2,
                        marginLeft: -0.5,
                        height: "31px",
                        width: "40%",
                        borderRadius: 5,
                    }}
                    inputSx={{ fontSize: "0.75rem" }}
                    value={assetSearchValue}
                    onChange={handleAssetSearchChanged}
                    data-testid="selected-point-of-attack-asset-search-field"
                />

                <EditorSidebarAssetList
                    items={
                        assetSearchValue != ""
                            ? items.filter((item) => {
                                  const lcSearchValue = assetSearchValue.toLowerCase();
                                  return (
                                      assetSearchValue === "" ||
                                      item.name.replace(/_/g, " ").toLowerCase().includes(lcSearchValue)
                                  );
                              })
                            : items
                    }
                    checkedAssets={selectedPointOfAttack.assets}
                    onChangeHandler={handleOnAssetChanged}
                />
            </Box>
        </>
    );
};
