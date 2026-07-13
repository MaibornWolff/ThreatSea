import { Delete, Autorenew } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/system";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { TextField } from "#view/components/textfield.component.tsx";
import type { SystemConnection } from "#api/types/system.types.ts";

interface EditorSidebarSelectedConnectionProps {
    selectedConnection: SystemConnection | undefined;
    handleDeleteConnection: () => void;
    handleOnConnectionNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
    handleResetConnectionRouting: () => void;
    userRole: USER_ROLES | undefined;
}

export const EditorSidebarSelectedConnection = ({
    selectedConnection,
    handleDeleteConnection,
    handleOnConnectionNameChange,
    handleResetConnectionRouting,
    userRole,
}: EditorSidebarSelectedConnectionProps) => {
    const theme = useTheme();
    const { t } = useTranslation("editorPage");
    const isEditor = checkUserRole(userRole, USER_ROLES.EDITOR);
    return (
        <Box>
            <Box
                sx={{
                    display: "flex",
                    backgroundColor: "transparent",
                    borderRadius: 15,
                    paddingLeft: 0,
                    paddingRight: 0,
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    marginBottom: "-10px",
                    height: "32px",
                }}
            >
                <TextField
                    value={selectedConnection?.name ? selectedConnection.name : ""}
                    onChange={handleOnConnectionNameChange}
                    //dont delete the whole Component if Delete is pressed
                    onKeyUp={(event) => {
                        if (event.key === "Delete") {
                            event.stopPropagation();
                        }
                    }}
                    sx={{
                        border: "none !important",
                        width: "82.5%",
                        "*": {
                            border: "none !important",
                            padding: "0 !important",
                            borderRadius: "0 !important",
                        },
                        "& .Mui-focused": {
                            borderBottom: `1px solid ${theme.vars.palette.primary.main} !important`,
                        },
                        input: {
                            fontSize: "0.875rem !important",
                            fontWeight: "bold !important",
                            width: "100% !important",
                        },
                        color: "text.primary !important",
                        padding: "0 !important",
                    }}
                />
                {isEditor && selectedConnection?.pinned && (
                    <Tooltip title={t("sidebar.connection.resetRouting")}>
                        <IconButton
                            onClick={handleResetConnectionRouting}
                            aria-label={t("sidebar.connection.resetRouting")}
                            sx={{
                                "&:hover": {
                                    backgroundColor: "background.paperIntransparent",
                                },
                                marginTop: -1,
                            }}
                        >
                            <Autorenew sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                )}
                {isEditor && (
                    <IconButton
                        onClick={handleDeleteConnection}
                        sx={{
                            "&:hover": {
                                color: "error.light",
                                backgroundColor: "background.paperIntransparent",
                            },
                            marginTop: -1,
                        }}
                    >
                        <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                )}
            </Box>
        </Box>
    );
};
