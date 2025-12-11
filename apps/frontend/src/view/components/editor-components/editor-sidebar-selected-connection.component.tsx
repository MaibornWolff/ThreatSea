import { Delete } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { Box } from "@mui/system";
import type { ChangeEvent } from "react";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { TextField } from "../textfield.component";
import type { SystemConnection } from "#api/types/system.types.ts";

interface EditorSidebarSelectedConnectionProps {
    selectedConnection: SystemConnection | undefined;
    handleDeleteConnection: () => void;
    handleOnConnectionNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
    userRole: USER_ROLES | undefined;
}

export const EditorSidebarSelectedConnection = ({
    selectedConnection,
    handleDeleteConnection,
    handleOnConnectionNameChange,
    userRole,
}: EditorSidebarSelectedConnectionProps) => {
    return (
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
                            borderBottom: "1px solid rgba(35, 60, 87, 1) !important",
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
                {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                    <IconButton
                        onClick={handleDeleteConnection}
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
        </Box>
    );
};
