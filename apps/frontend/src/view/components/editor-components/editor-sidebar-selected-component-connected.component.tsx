import { useTranslation } from "react-i18next";
import { Box, IconButton, Typography } from "@mui/material";
import Delete from "@mui/icons-material/Delete";
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
                    {t("sidebar.connected_components.title")}
                </Typography>
            </Box>
            <Box>
                {connectedComponents.map((connection, index) => {
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
                                    color: "text.primary",
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
                                        color: "error.light",
                                        backgroundColor: "background.paperIntransparent",
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
