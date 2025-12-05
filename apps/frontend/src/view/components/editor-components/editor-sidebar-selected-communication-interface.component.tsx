import { IconButton, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useTranslation } from "react-i18next";
import { EditorSidebarAssetList } from "./editor-sidebar-asset-list.component";
import { SearchField } from "../search-field.component";
import { TextField } from "../textfield.component";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { Delete } from "@mui/icons-material";
import type { ChangeEvent } from "react";
import type { SystemConnectionPoint } from "#application/adapters/system-connection-point.adapter.ts";
import type { Asset } from "#api/types/asset.types.ts";
import type { SystemPointOfAttack } from "#api/types/system.types.ts";

interface EditorSidebarSelectedCommunicationInterfaceProps {
    selectedConnectionPoint: SystemConnectionPoint;
    selectedPointOfAttack: SystemPointOfAttack | null | undefined;
    assetSearchValue: string;
    handleAssetSearchChanged: (event: ChangeEvent<HTMLInputElement>) => void;
    items: Asset[];
    handleOnAssetChanged: (event: ChangeEvent<HTMLInputElement>, asset: Asset) => void;
    handleOnConnectionPointDescriptionChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleChangeCommunicationInterfaceName: (componentId: string, interfaceId: string, value: string) => void;
    handleDeleteCommunicationInterface: (
        componentId: string,
        interfaceId: string,
        interfaceName: string | null,
        isFromCommunicationInterfaceSidebar?: boolean
    ) => void;
    userRole: USER_ROLES | undefined;
}

export const EditorSidebarSelectedCommunicationInterface = ({
    selectedConnectionPoint,
    selectedPointOfAttack,
    assetSearchValue,
    handleAssetSearchChanged,
    items,
    handleOnAssetChanged,
    handleOnConnectionPointDescriptionChange,
    handleChangeCommunicationInterfaceName,
    handleDeleteCommunicationInterface,
    userRole,
}: EditorSidebarSelectedCommunicationInterfaceProps) => {
    const { t } = useTranslation("editorPage");
    return (
        <>
            <Box>
                <Box
                    sx={{
                        display: "flex",
                        backgroundColor: "#f2f4f500",
                        borderRadius: 15,
                        paddingLeft: 0,
                        paddingRight: 0,
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "-10px",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            backgroundColor: "#f2f4f500",
                            borderRadius: 15,
                            paddingLeft: 0,
                            paddingRight: 0,
                            alignItems: "flex-start",
                            marginBottom: "8px",
                        }}
                    >
                        <Typography
                            sx={{
                                fontWeight: "bold",
                                fontSize: "0.875rem",
                                color: "text.primary",
                                marginBottom: "4px",
                            }}
                        >
                            {selectedConnectionPoint?.componentName} Interface:
                        </Typography>
                        <TextField
                            value={selectedConnectionPoint?.name ? selectedConnectionPoint.name : ""}
                            onChange={(e) => {
                                if (!selectedConnectionPoint.componentId) {
                                    return;
                                }
                                handleChangeCommunicationInterfaceName(
                                    selectedConnectionPoint.componentId,
                                    selectedConnectionPoint.id,
                                    e.target.value
                                );
                            }}
                            onKeyUp={(event) => {
                                if (event.key === "Delete") {
                                    event.stopPropagation();
                                }
                            }}
                            sx={{
                                border: "none !important",
                                width: "100%",
                                "& .MuiInputBase-root": {
                                    borderBottom: "1px solid rgba(35, 60, 87, 0) !important",
                                },
                                "*": {
                                    border: "none !important",
                                    padding: "0 !important",
                                    borderRadius: "0 !important",
                                },
                                "& .Mui-focused": {
                                    borderBottom: "1px solid rgba(35, 60, 87, 1) !important",
                                },
                                input: {
                                    fontSize: "0.875rem !important",
                                    width: "100% !important",
                                },
                                color: "text.primary !important",
                                padding: "0 !important",
                            }}
                        />
                    </Box>
                    {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                        <IconButton
                            onClick={() => {
                                if (!selectedConnectionPoint.componentId) {
                                    return;
                                }
                                handleDeleteCommunicationInterface(
                                    selectedConnectionPoint.componentId,
                                    selectedConnectionPoint.id,
                                    selectedConnectionPoint.name,
                                    true
                                );
                            }}
                            sx={{
                                "&:hover": {
                                    color: "#ef5350",
                                    backgroundColor: "background.paperIntransparent",
                                },
                                marginTop: -1,
                            }}
                        >
                            <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                    )}
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
                        {t("sidebar.description.title")}
                    </Typography>
                </Box>
                <TextField
                    value={selectedConnectionPoint?.description ? selectedConnectionPoint.description : ""}
                    onChange={handleOnConnectionPointDescriptionChange}
                    onKeyUp={(event) => {
                        if (event.key === "Delete") {
                            event.stopPropagation();
                        }
                    }}
                    multiline
                    minRows={1}
                    maxRows={Infinity}
                    sx={{
                        border: "none !important",
                        width: "100%",
                        "& .MuiInputBase-root": {
                            borderBottom: "1px solid rgba(35, 60, 87, 0) !important",
                        },
                        "*": {
                            border: "none !important",
                            padding: "0 !important",
                            borderRadius: "0 !important",
                        },
                        "& .Mui-focused": {
                            borderBottom: "1px solid rgba(35, 60, 87, 1) !important",
                        },
                        textarea: {
                            fontSize: "0.875rem !important",
                            width: "100% !important",
                            lineHeight: "1.5 !important",
                        },
                        color: "text.primary !important",
                        padding: "0 !important",
                    }}
                />

                {selectedPointOfAttack !== undefined && selectedPointOfAttack != null && (
                    <Box>
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
                                width: "40%",
                                height: "31px",
                                borderRadius: 5,
                            }}
                            inputSx={{ fontSize: "0.75rem" }}
                            value={assetSearchValue}
                            onChange={handleAssetSearchChanged}
                            data-testid="selected-communication-asset-search-field"
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
                )}
            </Box>
        </>
    );
};
