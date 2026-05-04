import { Delete } from "@mui/icons-material";
import { IconButton, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useTranslation } from "react-i18next";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { EditorColorPicker } from "./editor-color-picker.component";
import type { Annotation } from "#api/types/system.types.ts";

interface EditorSidebarSelectedAnnotationProps {
    selectedAnnotation: Annotation;
    userRole: USER_ROLES | undefined;
    onColorChange: (stroke: string) => void;
    onDelete: () => void;
}

export const EditorSidebarSelectedAnnotation = ({
    selectedAnnotation,
    userRole,
    onColorChange,
    onDelete,
}: EditorSidebarSelectedAnnotationProps) => {
    const { t } = useTranslation("editorPage");
    const isEditor = checkUserRole(userRole, USER_ROLES.EDITOR);

    return (
        <Box>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                }}
            >
                <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem" }}>
                    {t("sidebar.annotation.title")}
                </Typography>
                {isEditor && (
                    <IconButton
                        onClick={onDelete}
                        aria-label={t("sidebar.annotation.delete")}
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

            <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Typography sx={{ fontSize: "0.8rem", minWidth: "70px" }}>{t("sidebar.annotation.stroke")}</Typography>
                <EditorColorPicker color={selectedAnnotation.stroke} onChange={onColorChange} disabled={!isEditor} />
            </Box>
        </Box>
    );
};
