import Delete from "@mui/icons-material/Delete";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { TextField } from "#view/components/textfield.component.tsx";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import type { ChangeEvent } from "react";

interface EditorSidebarComponentHeaderProps {
    name: string;
    onNameChange: (event: ChangeEvent<HTMLInputElement>) => void;
    userRole: USER_ROLES | undefined;
    onChangeIcon: () => void;
    onDelete: () => void;
}

/** Selected-component header: editable name plus change-symbol and delete controls. */
export const EditorSidebarComponentHeader = ({
    name,
    onNameChange,
    userRole,
    onChangeIcon,
    onDelete,
}: EditorSidebarComponentHeaderProps) => {
    const { t } = useTranslation("editorPage");
    const theme = useTheme();

    return (
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
            }}
        >
            <TextField
                value={name}
                onChange={onNameChange}
                autoFocus={false}
                // Don't delete the whole Component if Delete is pressed
                onKeyUp={(event) => {
                    if (event.key === "Delete") {
                        event.stopPropagation();
                    }
                }}
                sx={{
                    border: "none !important",
                    width: "82.5%",
                    "& .MuiInputBase-root": {
                        borderBottom: "1px solid transparent !important",
                    },
                    "*": {
                        border: "none !important",
                        padding: "0 !important",
                        borderRadius: "0 !important",
                        fontWeight: "bold",
                    },
                    "& .Mui-focused": {
                        borderBottom: `1px solid ${theme.vars.palette.primary.main} !important`,
                    },
                    input: {
                        fontSize: "0.875rem !important",
                        width: "100% !important",
                    },
                    color: `${theme.vars.palette.text.primary} !important`,
                    padding: "0 !important",
                }}
            />
            {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                <>
                    <Tooltip title={t("sidebar.icon.change")}>
                        <IconButton
                            onClick={onChangeIcon}
                            aria-label={t("sidebar.icon.change")}
                            data-testid="change-component-icon"
                            sx={{
                                "&:hover": {
                                    backgroundColor: theme.vars.palette.background.paperIntransparent,
                                },
                                marginTop: -1,
                            }}
                        >
                            <ImageOutlined sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                    <IconButton
                        onClick={onDelete}
                        aria-label={t("sidebar.component.delete")}
                        sx={{
                            "&:hover": {
                                color: theme.vars.palette.error.light,
                                backgroundColor: theme.vars.palette.background.paperIntransparent,
                            },
                            marginTop: -1,
                        }}
                    >
                        <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                </>
            )}
        </Box>
    );
};
