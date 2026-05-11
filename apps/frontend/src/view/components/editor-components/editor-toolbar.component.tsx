import {
    CenterFocusWeak,
    CreateOutlined,
    CropSquare,
    Download,
    ShapeLineOutlined,
    HorizontalRule,
    RadioButtonUnchecked,
    TextFields,
    TrendingFlat,
} from "@mui/icons-material";
import { Box, IconButton, Popover, Tooltip } from "@mui/material";
import { useRef, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { EditorColorPicker } from "./editor-color-picker.component";
import { ANNOTATION_TYPE_LABEL_KEYS, type AnnotationType } from "#api/types/system.types.ts";

export interface EditorToolbarProps {
    onCenterEditor: () => void;
    onDownloadSystemView: () => void;
    showAnnotationTools: boolean;
    annotationTool: AnnotationType | null;
    onSetAnnotationTool: (tool: AnnotationType | null) => void;
    annotationColor: string;
    onSetAnnotationColor: (color: string) => void;
}

const buttonContainerSx = {
    position: "absolute",
    left: 8,
    width: "38px",
    marginLeft: "auto",
    marginRight: "auto",
};

const iconButtonSx = {
    backgroundColor: "background.paperIntransparent",
    "&:hover": {
        backgroundColor: "rgba(149, 163, 181, 0.7)",
    },
};

const activeIconButtonSx = {
    backgroundColor: "rgba(35, 60, 87, 0.85)",
    "&:hover": {
        backgroundColor: "rgba(35, 60, 87, 1)",
    },
};

const iconSx = { fontSize: 30, color: "primary.main" };
const activeIconSx = { fontSize: 30, color: "#ffffff" };

const ANNOTATION_TOOLS: { tool: AnnotationType; Icon: ComponentType<{ sx?: object }> }[] = [
    { tool: "rect", Icon: CropSquare },
    { tool: "circle", Icon: RadioButtonUnchecked },
    { tool: "line", Icon: HorizontalRule },
    { tool: "arrow", Icon: TrendingFlat },
];

export const EditorToolbar = ({
    onCenterEditor,
    onDownloadSystemView,
    showAnnotationTools,
    annotationTool,
    onSetAnnotationTool,
    annotationColor,
    onSetAnnotationColor,
}: EditorToolbarProps) => {
    const { t } = useTranslation("editorPage");
    const shapesButtonRef = useRef<HTMLButtonElement | null>(null);
    const colorButtonRef = useRef<HTMLButtonElement | null>(null);
    const [shapesOpen, setShapesOpen] = useState(false);
    const [colorOpen, setColorOpen] = useState(false);

    const toggleTool = (tool: AnnotationType): void => {
        onSetAnnotationTool(annotationTool === tool ? null : tool);
        setShapesOpen(false);
    };

    // Pencil and text are standalone now.
    const isShapesActive = ANNOTATION_TOOLS.some(({ tool }) => tool === annotationTool);

    return (
        <>
            <Box sx={{ ...buttonContainerSx, top: 8 }}>
                <Tooltip title={t("canvas.centerEditor")}>
                    <IconButton onClick={onCenterEditor} aria-label={t("canvas.centerEditor")} sx={iconButtonSx}>
                        <CenterFocusWeak sx={iconSx} />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box sx={{ ...buttonContainerSx, top: 60 }}>
                <Tooltip title={t("canvas.exportSystemImage")}>
                    <IconButton
                        onClick={onDownloadSystemView}
                        aria-label={t("canvas.exportSystemImage")}
                        sx={iconButtonSx}
                    >
                        <Download sx={iconSx} />
                    </IconButton>
                </Tooltip>
            </Box>
            {showAnnotationTools && (
                <>
                    <Box sx={{ ...buttonContainerSx, top: 120 }}>
                        <Tooltip title={t("canvas.annotation.shapes")}>
                            <IconButton
                                ref={shapesButtonRef}
                                onClick={() => setShapesOpen((open) => !open)}
                                aria-label={t("canvas.annotation.shapes")}
                                aria-pressed={isShapesActive}
                                sx={isShapesActive ? activeIconButtonSx : iconButtonSx}
                            >
                                <ShapeLineOutlined sx={isShapesActive ? activeIconSx : iconSx} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Popover
                        open={shapesOpen}
                        anchorEl={shapesButtonRef.current}
                        onClose={() => setShapesOpen(false)}
                        anchorOrigin={{ vertical: "center", horizontal: "right" }}
                        transformOrigin={{ vertical: "center", horizontal: "left" }}
                        slotProps={{
                            paper: {
                                sx: {
                                    marginLeft: "8px",
                                    borderRadius: "12px",
                                    padding: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                },
                            },
                        }}
                    >
                        {ANNOTATION_TOOLS.map(({ tool, Icon }) => {
                            const isActive = annotationTool === tool;
                            const label = t(ANNOTATION_TYPE_LABEL_KEYS[tool]);
                            return (
                                <Tooltip key={tool} title={label}>
                                    <IconButton
                                        onClick={() => toggleTool(tool)}
                                        aria-label={label}
                                        aria-pressed={isActive}
                                        sx={isActive ? activeIconButtonSx : iconButtonSx}
                                    >
                                        <Icon sx={isActive ? activeIconSx : iconSx} />
                                    </IconButton>
                                </Tooltip>
                            );
                        })}
                    </Popover>
                    <Box sx={{ ...buttonContainerSx, top: 180 }}>
                        <Tooltip title={t("canvas.annotation.freehand")}>
                            <IconButton
                                onClick={() => onSetAnnotationTool(annotationTool === "freehand" ? null : "freehand")}
                                aria-label={t("canvas.annotation.freehand")}
                                aria-pressed={annotationTool === "freehand"}
                                sx={annotationTool === "freehand" ? activeIconButtonSx : iconButtonSx}
                            >
                                <CreateOutlined sx={annotationTool === "freehand" ? activeIconSx : iconSx} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Box sx={{ ...buttonContainerSx, top: 240 }}>
                        <Tooltip title={t("canvas.annotation.text")}>
                            <IconButton
                                onClick={() => onSetAnnotationTool(annotationTool === "text" ? null : "text")}
                                aria-label={t("canvas.annotation.text")}
                                aria-pressed={annotationTool === "text"}
                                sx={annotationTool === "text" ? activeIconButtonSx : iconButtonSx}
                            >
                                <TextFields sx={annotationTool === "text" ? activeIconSx : iconSx} />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Box sx={{ ...buttonContainerSx, top: 300 }}>
                        <Tooltip title={t("canvas.annotation.color")}>
                            <IconButton
                                ref={colorButtonRef}
                                onClick={() => setColorOpen((open) => !open)}
                                aria-label={t("canvas.annotation.color")}
                                sx={iconButtonSx}
                            >
                                <Box
                                    sx={{
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "50%",
                                        backgroundColor: annotationColor,
                                        border: "2px solid #ffffff",
                                        boxShadow: "0 0 0 1px rgba(35, 60, 87, 0.6)",
                                    }}
                                />
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Popover
                        open={colorOpen}
                        anchorEl={colorButtonRef.current}
                        onClose={() => setColorOpen(false)}
                        anchorOrigin={{ vertical: "center", horizontal: "right" }}
                        transformOrigin={{ vertical: "center", horizontal: "left" }}
                        slotProps={{
                            paper: {
                                sx: {
                                    marginLeft: "8px",
                                    borderRadius: "12px",
                                    padding: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                },
                            },
                        }}
                    >
                        <EditorColorPicker color={annotationColor} onChange={onSetAnnotationColor} />
                    </Popover>
                </>
            )}
        </>
    );
};
