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
import { Box, IconButton, Paper, Popover, Popper, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { EditorColorPicker } from "./editor-color-picker.component";
import type { AnnotationType } from "#api/types/system.types.ts";

const ANNOTATION_TYPE_LABEL_KEYS: Record<AnnotationType, string> = {
    rect: "canvas.annotation.rectangle",
    circle: "canvas.annotation.circle",
    line: "canvas.annotation.line",
    arrow: "canvas.annotation.arrow",
    freehand: "canvas.annotation.freehand",
    text: "canvas.annotation.text",
};

export interface EditorToolbarProps {
    onCenterEditor: () => void;
    onDownloadSystemView: () => void;
    showAnnotationTools: boolean;
    annotationTool: AnnotationType | null;
    onSetAnnotationTool: (tool: AnnotationType | null) => void;
    annotationColor: string;
    onSetAnnotationColor: (color: string) => void;
}

// Opaque panel behind the button column so canvas elements cannot show or be
// clicked through the gaps between buttons
const toolbarPanelSx = {
    position: "absolute",
    top: 8,
    left: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    padding: "4px",
    borderRadius: "12px",
    backgroundColor: "background.paperIntransparent",
    boxShadow: 3,
};

const iconSx = { fontSize: 30, color: "primary.main" };
const activeIconSx = { fontSize: 30, color: "text.white" };

const ANNOTATION_TOOLS: { tool: AnnotationType; Icon: ComponentType<{ sx?: object }> }[] = [
    { tool: "rect", Icon: CropSquare },
    { tool: "circle", Icon: RadioButtonUnchecked },
    { tool: "line", Icon: HorizontalRule },
    { tool: "arrow", Icon: TrendingFlat },
];

const popoverPaperSx = {
    marginLeft: "8px",
    borderRadius: "12px",
    padding: "6px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
};

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
    const theme = useTheme();
    const [shapesButton, setShapesButton] = useState<HTMLButtonElement | null>(null);
    const [freehandButton, setFreehandButton] = useState<HTMLButtonElement | null>(null);
    const [shapesOpen, setShapesOpen] = useState(false);

    const iconButtonSx = {
        backgroundColor: "background.paperIntransparent",
        "&:hover": {
            backgroundColor: "background.toolbarHover",
        },
    };

    const activeIconButtonSx = {
        backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.85)`,
        "&:hover": {
            backgroundColor: theme.vars.palette.primary.main,
        },
    };

    const toggleTool = (tool: AnnotationType): void => {
        onSetAnnotationTool(annotationTool === tool ? null : tool);
        setShapesOpen(false);
    };

    // Pencil and text are standalone now.
    const isShapesActive = ANNOTATION_TOOLS.some(({ tool }) => tool === annotationTool);

    const toolOptionsAnchor = (() => {
        if (!annotationTool || annotationTool === "text") {
            return null;
        }
        if (annotationTool === "freehand") {
            return freehandButton;
        }
        return shapesButton;
    })();

    return (
        <>
            <Box sx={toolbarPanelSx} data-testid="editor-toolbar-backing-panel">
                <Tooltip title={t("canvas.centerEditor")}>
                    <IconButton onClick={onCenterEditor} aria-label={t("canvas.centerEditor")} sx={iconButtonSx}>
                        <CenterFocusWeak sx={iconSx} />
                    </IconButton>
                </Tooltip>
                <Tooltip title={t("canvas.exportSystemImage")}>
                    <IconButton
                        onClick={onDownloadSystemView}
                        aria-label={t("canvas.exportSystemImage")}
                        sx={iconButtonSx}
                    >
                        <Download sx={iconSx} />
                    </IconButton>
                </Tooltip>
                {showAnnotationTools && (
                    <>
                        <Tooltip title={t("canvas.annotation.shapes")}>
                            <IconButton
                                ref={setShapesButton}
                                onClick={() => {
                                    setShapesOpen((open) => !open);
                                    onSetAnnotationTool(null);
                                }}
                                aria-label={t("canvas.annotation.shapes")}
                                aria-pressed={isShapesActive}
                                sx={isShapesActive ? activeIconButtonSx : iconButtonSx}
                            >
                                <ShapeLineOutlined sx={isShapesActive ? activeIconSx : iconSx} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t("canvas.annotation.freehand")}>
                            <IconButton
                                ref={setFreehandButton}
                                onClick={() => onSetAnnotationTool(annotationTool === "freehand" ? null : "freehand")}
                                aria-label={t("canvas.annotation.freehand")}
                                aria-pressed={annotationTool === "freehand"}
                                sx={annotationTool === "freehand" ? activeIconButtonSx : iconButtonSx}
                            >
                                <CreateOutlined sx={annotationTool === "freehand" ? activeIconSx : iconSx} />
                            </IconButton>
                        </Tooltip>
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
                    </>
                )}
            </Box>
            {showAnnotationTools && (
                <>
                    <Popover
                        open={shapesOpen}
                        anchorEl={shapesButton}
                        onClose={() => setShapesOpen(false)}
                        anchorOrigin={{ vertical: "center", horizontal: "right" }}
                        transformOrigin={{ vertical: "center", horizontal: "left" }}
                        slotProps={{ paper: { sx: popoverPaperSx } }}
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
                    <Popper
                        open={toolOptionsAnchor !== null && !shapesOpen}
                        anchorEl={toolOptionsAnchor}
                        placement="right"
                        sx={{ zIndex: 1300 }}
                    >
                        <Paper sx={popoverPaperSx}>
                            <EditorColorPicker color={annotationColor} onChange={onSetAnnotationColor} stacked />
                        </Paper>
                    </Popper>
                </>
            )}
        </>
    );
};
