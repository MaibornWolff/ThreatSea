import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography } from "@mui/material";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { SearchField } from "#view/components/search-field.component.tsx";
import { ToggleButtons } from "#view/components/toggle-buttons.component.tsx";
import { AssetSecurityNeedsPopper } from "./asset-security-needs-popper.component";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { POA_COLORS } from "#view/colors/pointsOfAttack.colors.ts";
import { useAssetHoverPopper } from "#application/hooks/useAssetHoverPopper.ts";
import type { ChangeEvent } from "react";
import type { SortDirection } from "#application/actions/list.actions.ts";
import type { Asset } from "#api/types/asset.types.ts";
import type { SystemPointOfAttack } from "#api/types/system.types.ts";

export interface EditorSidebarSelectedComponentAssetsProps {
    items: Asset[];
    assetSearchValue: string;
    handleAssetSearchChanged: (event: ChangeEvent<HTMLInputElement>) => void;
    pointsOfAttackOfSelectedComponent: SystemPointOfAttack[];
    handleAssetNameClick: (asset: Asset) => void;
    handleAddAssetToAllPointsOfAttack: (event: React.MouseEvent<HTMLElement>, asset: Asset) => void;
    handleRemoveAssetFromAllPointsOfAttack: (event: React.MouseEvent<HTMLElement>, asset: Asset) => void;
}

export const EditorSidebarSelectedComponentAssets = ({
    items,
    assetSearchValue,
    handleAssetSearchChanged,
    pointsOfAttackOfSelectedComponent,
    handleAssetNameClick,
    handleAddAssetToAllPointsOfAttack,
    handleRemoveAssetFromAllPointsOfAttack,
}: EditorSidebarSelectedComponentAssetsProps) => {
    const { t } = useTranslation("editorPage");
    const { anchorEl: assetAnchorEl, hoveredAsset, handleAssetHover, handleAssetLeave } = useAssetHoverPopper();
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const handleSortDirectionChanged = (_event: React.MouseEvent<HTMLElement>, value: SortDirection) => {
        if (value) {
            setSortDirection(value);
        }
    };

    const visibleAssets = items
        .filter((item) => {
            const lcSearchValue = assetSearchValue.toLowerCase();
            return assetSearchValue === "" || item.name.replace(/_/g, " ").toLowerCase().includes(lcSearchValue);
        })
        .toSorted((a, b) => {
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            const comparison = nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            return sortDirection === "asc" ? comparison : -comparison;
        });

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    backgroundColor: "background.paperWhite",
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
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 1,
                }}
            >
                <SearchField
                    sx={{
                        marginLeft: -0.5,
                        width: "40%",
                        height: "31px",
                        borderRadius: 5,
                    }}
                    inputSx={{ fontSize: "0.75rem" }}
                    //don't delete the whole Component if Delete is pressed
                    onKeyUp={(event) => {
                        if (event.key === "Delete") {
                            event.stopPropagation();
                        }
                    }}
                    value={assetSearchValue}
                    onChange={handleAssetSearchChanged}
                    data-testid="selected-component-asset-search-field"
                />
                <ToggleButtons
                    value={sortDirection}
                    onChange={handleSortDirectionChanged}
                    buttons={[
                        {
                            icon: ArrowUpward,
                            value: "asc",
                            "data-testid": "selected-component-asset-ascending-sort-button",
                        },
                        {
                            icon: ArrowDownward,
                            value: "desc",
                            "data-testid": "selected-component-asset-descending-sort-button",
                        },
                    ]}
                />
            </Box>
            <Box>
                {visibleAssets.map((asset, index) => {
                    let assetIsSetOnCommunicationInterfaces = false;
                    return (
                        <Box
                            key={index}
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 1,
                            }}
                        >
                            <Typography
                                onClick={() => handleAssetNameClick(asset)}
                                onMouseEnter={(event) => handleAssetHover(event, asset)}
                                onMouseLeave={handleAssetLeave}
                                sx={{
                                    minWidth: "130px",
                                    maxWidth: "130px",
                                    color: "text.primary",
                                    fontSize: "0.75rem",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                    "&:hover": { textDecoration: "underline" },
                                }}
                                data-testid="selected-component-asset-search-results"
                            >
                                {asset.name}
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    minWidth: "104px",
                                }}
                            >
                                {pointsOfAttackOfSelectedComponent
                                    .toSorted((a, b) => b.type.localeCompare(a.type))
                                    .map((pointOfAttack, pointOfAttackIndex) => {
                                        if (
                                            !assetIsSetOnCommunicationInterfaces &&
                                            pointOfAttack.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES
                                        ) {
                                            assetIsSetOnCommunicationInterfaces = true;
                                            const communicationInterfaces = pointsOfAttackOfSelectedComponent.filter(
                                                (poa) => poa.type === POINTS_OF_ATTACK.COMMUNICATION_INTERFACES
                                            );
                                            const setInterfaces = communicationInterfaces.filter((poa) =>
                                                poa.assets.includes(asset.id)
                                            );
                                            if (setInterfaces.length > 0) {
                                                return (
                                                    <Box key={pointOfAttackIndex}>
                                                        <Box
                                                            sx={{
                                                                backgroundColor: POA_COLORS[pointOfAttack.type].normal,
                                                                width: "16px",
                                                                height: "16px",
                                                                marginLeft: 1,
                                                                borderRadius: 50,
                                                                clipPath:
                                                                    setInterfaces.length ===
                                                                    communicationInterfaces.length
                                                                        ? "circle(50%)"
                                                                        : "polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)",
                                                            }}
                                                        ></Box>
                                                    </Box>
                                                );
                                            }
                                        } else if (
                                            pointOfAttack.type !== POINTS_OF_ATTACK.COMMUNICATION_INTERFACES &&
                                            pointOfAttack.assets.includes(asset.id)
                                        ) {
                                            return (
                                                <Box key={pointOfAttackIndex}>
                                                    <Box
                                                        sx={{
                                                            backgroundColor: POA_COLORS[pointOfAttack.type].normal,
                                                            width: "16px",
                                                            height: "16px",
                                                            marginLeft: 1,
                                                            borderRadius: 50,
                                                        }}
                                                    ></Box>
                                                </Box>
                                            );
                                        }
                                        return null;
                                    })}
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    marginLeft: "auto",
                                }}
                            >
                                <ToggleButtons
                                    value={(() => {
                                        // Count how many POAs (including com interfaces) have this asset
                                        const totalAssetOccurrences = pointsOfAttackOfSelectedComponent.reduce(
                                            (count, poa) => count + (poa.assets.includes(asset.id) ? 1 : 0),
                                            0
                                        );

                                        if (totalAssetOccurrences === 0) {
                                            return "unsetAll";
                                        }

                                        if (totalAssetOccurrences === pointsOfAttackOfSelectedComponent.length) {
                                            return "setAll";
                                        }

                                        return "";
                                    })()}
                                    buttonProps={{
                                        width: "87px",
                                    }}
                                    buttons={[
                                        {
                                            value: "setAll",
                                            text: t("setAllBtn"),
                                            onClick: (e) => handleAddAssetToAllPointsOfAttack(e, asset),
                                        },
                                        {
                                            value: "unsetAll",
                                            text: t("unsetAllBtn"),
                                            onClick: (e) => handleRemoveAssetFromAllPointsOfAttack(e, asset),
                                        },
                                    ]}
                                />
                            </Box>
                        </Box>
                    );
                })}
                <AssetSecurityNeedsPopper anchorEl={assetAnchorEl} asset={hoveredAsset} />
            </Box>
        </>
    );
};
