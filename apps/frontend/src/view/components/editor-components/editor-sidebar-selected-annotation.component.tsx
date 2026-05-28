import { Delete, FormatBold, FormatItalic, FormatUnderlined } from "@mui/icons-material";
import { FormControl, IconButton, MenuItem, Select, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useTranslation } from "react-i18next";
import { checkUserRole, USER_ROLES } from "../../../api/types/user-roles.types";
import { EditorColorPicker } from "./editor-color-picker.component";
import { FONT_SIZE_CHOICES, formatToggleSx } from "./text-format-controls";
import {
    DEFAULT_TEXT_FONT_SIZE,
    type Annotation,
    type AnnotationChanges,
    type AnnotationType,
} from "#api/types/system.types.ts";

interface EditorSidebarSelectedAnnotationProps {
    selectedAnnotation: Annotation;
    userRole: USER_ROLES | undefined;
    onColorChange: (stroke: string) => void;
    onColorPreview?: ((stroke: string) => void) | undefined;
    onChange: (changes: AnnotationChanges) => void;
    onDelete: () => void;
}

const ANNOTATION_TYPE_LABEL_KEYS: Record<AnnotationType, string> = {
    rect: "canvas.annotation.rectangle",
    circle: "canvas.annotation.circle",
    line: "canvas.annotation.line",
    arrow: "canvas.annotation.arrow",
    freehand: "canvas.annotation.freehand",
    text: "canvas.annotation.text",
};

export const EditorSidebarSelectedAnnotation = ({
    selectedAnnotation,
    userRole,
    onColorChange,
    onColorPreview,
    onChange,
    onDelete,
}: EditorSidebarSelectedAnnotationProps) => {
    const { t } = useTranslation("editorPage");
    const isEditor = checkUserRole(userRole, USER_ROLES.EDITOR);
    const fontSize =
        selectedAnnotation.type === "text"
            ? (selectedAnnotation.fontSize ?? DEFAULT_TEXT_FONT_SIZE)
            : DEFAULT_TEXT_FONT_SIZE;

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
                    {`${t("sidebar.annotation.title")}: ${t(ANNOTATION_TYPE_LABEL_KEYS[selectedAnnotation.type])}`}
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
                <EditorColorPicker
                    color={selectedAnnotation.stroke}
                    onChange={onColorChange}
                    onPreview={onColorPreview}
                    disabled={!isEditor}
                />
            </Box>

            {selectedAnnotation.type === "text" && (
                <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                        <Typography sx={{ fontSize: "0.8rem", minWidth: "70px" }}>
                            {t("sidebar.annotation.format")}
                        </Typography>
                        <IconButton
                            size="small"
                            disabled={!isEditor}
                            onClick={() => onChange({ type: "text", bold: !selectedAnnotation.bold })}
                            aria-label={t("sidebar.annotation.bold")}
                            aria-pressed={!!selectedAnnotation.bold}
                            sx={formatToggleSx(!!selectedAnnotation.bold)}
                        >
                            <FormatBold sx={{ fontSize: 20 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            disabled={!isEditor}
                            onClick={() => onChange({ type: "text", italic: !selectedAnnotation.italic })}
                            aria-label={t("sidebar.annotation.italic")}
                            aria-pressed={!!selectedAnnotation.italic}
                            sx={formatToggleSx(!!selectedAnnotation.italic)}
                        >
                            <FormatItalic sx={{ fontSize: 20 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            disabled={!isEditor}
                            onClick={() => onChange({ type: "text", underline: !selectedAnnotation.underline })}
                            aria-label={t("sidebar.annotation.underline")}
                            aria-pressed={!!selectedAnnotation.underline}
                            sx={formatToggleSx(!!selectedAnnotation.underline)}
                        >
                            <FormatUnderlined sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                        <Typography sx={{ fontSize: "0.8rem", minWidth: "70px" }}>
                            {t("sidebar.annotation.fontSize")}
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: "80px" }}>
                            <Select
                                value={fontSize}
                                disabled={!isEditor}
                                onChange={(event) => onChange({ type: "text", fontSize: Number(event.target.value) })}
                                inputProps={{ "aria-label": t("sidebar.annotation.fontSize") }}
                            >
                                {FONT_SIZE_CHOICES.map((size) => (
                                    <MenuItem key={size} value={size}>
                                        {size}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </>
            )}
        </Box>
    );
};
