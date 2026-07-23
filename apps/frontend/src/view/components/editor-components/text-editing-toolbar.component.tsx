import Delete from "@mui/icons-material/Delete";
import FormatBold from "@mui/icons-material/FormatBold";
import FormatItalic from "@mui/icons-material/FormatItalic";
import FormatUnderlined from "@mui/icons-material/FormatUnderlined";
import { Box, Divider, FormControl, IconButton, MenuItem, Paper, Select, Tooltip } from "@mui/material";
import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { EditorColorPicker } from "./editor-color-picker.component";
import { FONT_SIZE_CHOICES, formatToggleSx } from "./text-format-controls";
import { DEFAULT_TEXT_FONT_SIZE, type AnnotationChanges, type TextAnnotation } from "#api/types/system.types.ts";

interface TextEditingToolbarProps {
    annotation: TextAnnotation;
    onChange: (changes: AnnotationChanges) => void;
    onColorChange: (stroke: string) => void;
    onColorPreview?: ((stroke: string) => void) | undefined;
    onColorOpen?: (() => void) | undefined;
    onDelete: () => void;
}

// Preserve the contentEditable's focus when a toolbar control is clicked.
const keepFocus = (event: MouseEvent): void => {
    event.preventDefault();
};

export const TextEditingToolbar = ({
    annotation,
    onChange,
    onColorChange,
    onColorPreview,
    onColorOpen,
    onDelete,
}: TextEditingToolbarProps) => {
    const { t } = useTranslation("editorPage");
    const fontSize = annotation.fontSize ?? DEFAULT_TEXT_FONT_SIZE;

    return (
        <Paper
            data-edit-protected=""
            elevation={3}
            sx={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 8px",
                borderRadius: "12px",
            }}
        >
            <EditorColorPicker
                color={annotation.stroke}
                onChange={onColorChange}
                onPreview={onColorPreview}
                onOpen={onColorOpen}
            />
            <Divider orientation="vertical" flexItem sx={{ marginX: "2px" }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <Tooltip title={t("sidebar.annotation.bold")}>
                    <IconButton
                        size="small"
                        onMouseDown={keepFocus}
                        onClick={() => onChange({ type: "text", bold: !annotation.bold })}
                        aria-label={t("sidebar.annotation.bold")}
                        aria-pressed={!!annotation.bold}
                        sx={formatToggleSx(!!annotation.bold)}
                    >
                        <FormatBold sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t("sidebar.annotation.italic")}>
                    <IconButton
                        size="small"
                        onMouseDown={keepFocus}
                        onClick={() => onChange({ type: "text", italic: !annotation.italic })}
                        aria-label={t("sidebar.annotation.italic")}
                        aria-pressed={!!annotation.italic}
                        sx={formatToggleSx(!!annotation.italic)}
                    >
                        <FormatItalic sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t("sidebar.annotation.underline")}>
                    <IconButton
                        size="small"
                        onMouseDown={keepFocus}
                        onClick={() => onChange({ type: "text", underline: !annotation.underline })}
                        aria-label={t("sidebar.annotation.underline")}
                        aria-pressed={!!annotation.underline}
                        sx={formatToggleSx(!!annotation.underline)}
                    >
                        <FormatUnderlined sx={{ fontSize: 18 }} />
                    </IconButton>
                </Tooltip>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ marginX: "2px" }} />
            <FormControl size="small" sx={{ minWidth: "72px" }}>
                <Select
                    value={fontSize}
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
            <Divider orientation="vertical" flexItem sx={{ marginX: "2px" }} />
            <Tooltip title={t("sidebar.annotation.delete")}>
                <IconButton
                    size="small"
                    onMouseDown={keepFocus}
                    onClick={onDelete}
                    aria-label={t("sidebar.annotation.delete")}
                    sx={{ "&:hover": { color: "error.light" } }}
                >
                    <Delete sx={{ fontSize: 18 }} />
                </IconButton>
            </Tooltip>
        </Paper>
    );
};
