import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Delete from "@mui/icons-material/Delete";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { SearchField } from "#view/components/search-field.component.tsx";
import { ToggleButtons } from "#view/components/toggle-buttons.component.tsx";
import type { ChangeEvent } from "react";
import type { SortDirection } from "#application/actions/list.actions.ts";
import type { AugmentedSystemComponent, ConnectionEndpointWithComponent } from "#api/types/system.types.ts";

export interface EditorSidebarSelectedComponentConnectedProps {
    selectedComponent: AugmentedSystemComponent;
    connectedComponents: ConnectionEndpointWithComponent[];
    handleSelectConnectedComponent: (componentId: string, communicationInterfaceId?: string | null) => void;
    handleDeleteConnectionBetweenComponents: (sourceComponentId: string, targetComponentId: string) => void;
}

export const EditorSidebarSelectedComponentConnected = ({
    selectedComponent,
    connectedComponents,
    handleSelectConnectedComponent,
    handleDeleteConnectionBetweenComponents,
}: EditorSidebarSelectedComponentConnectedProps) => {
    const { t } = useTranslation("editorPage");
    const theme = useTheme();
    const [searchValue, setSearchValue] = useState("");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const handleSearchChanged = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const handleSortDirectionChanged = (_event: React.MouseEvent<HTMLElement>, value: SortDirection) => {
        if (value) {
            setSortDirection(value);
        }
    };

    const visibleConnectedComponents = connectedComponents
        .filter((connection) => {
            const name = connection.component?.name ?? "";
            return searchValue === "" || name.toLowerCase().includes(searchValue.toLowerCase());
        })
        .toSorted((a, b) => {
            const nameA = a.component?.name.toLowerCase() ?? "";
            const nameB = b.component?.name.toLowerCase() ?? "";
            const comparison = nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            return sortDirection === "asc" ? comparison : -comparison;
        });

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    backgroundColor: theme.vars.palette.background.paperWhite,
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
                        color: theme.vars.palette.text.primary,
                    }}
                >
                    {t("sidebar.connected_components.title")}
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
                    value={searchValue}
                    onChange={handleSearchChanged}
                    data-testid="connected-component-search-field"
                />
                <ToggleButtons
                    value={sortDirection}
                    onChange={handleSortDirectionChanged}
                    buttons={[
                        {
                            icon: ArrowUpward,
                            value: "asc",
                            "data-testid": "connected-component-ascending-sort-button",
                        },
                        {
                            icon: ArrowDownward,
                            value: "desc",
                            "data-testid": "connected-component-descending-sort-button",
                        },
                    ]}
                />
            </Box>
            <Box>
                {visibleConnectedComponents.map((connection, index) => {
                    const connectedComponent = connection.component;
                    if (!connectedComponent) {
                        return null;
                    }

                    const communicationInterfaceName =
                        selectedComponent.type === "COMMUNICATION_INFRASTRUCTURE"
                            ? connectedComponent.communicationInterfaces?.find(
                                  (communicationInterface) =>
                                      communicationInterface.id === connection.communicationInterfaceId
                              )?.name
                            : undefined;

                    const label =
                        connectedComponent.name +
                        (communicationInterfaceName ? ` > ${communicationInterfaceName}` : "");

                    return (
                        <Box
                            key={index}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 1,
                            }}
                        >
                            <Typography
                                onClick={() =>
                                    handleSelectConnectedComponent(
                                        connectedComponent.id,
                                        connection.communicationInterfaceId
                                    )
                                }
                                sx={{
                                    fontSize: "0.75rem",
                                    fontWeight: "bold",
                                    color: theme.vars.palette.text.primary,
                                    cursor: "pointer",
                                    "&:hover": { textDecoration: "underline" },
                                }}
                                data-testid="connected-component-name"
                            >
                                {label}
                            </Typography>
                            <IconButton
                                onClick={() =>
                                    handleDeleteConnectionBetweenComponents(selectedComponent.id, connectedComponent.id)
                                }
                                sx={{
                                    "&:hover": {
                                        color: theme.vars.palette.error.light,
                                        backgroundColor: theme.vars.palette.background.paperIntransparent,
                                    },
                                }}
                            >
                                <Delete sx={{ fontSize: 18 }} />
                            </IconButton>
                        </Box>
                    );
                })}
            </Box>
        </>
    );
};
