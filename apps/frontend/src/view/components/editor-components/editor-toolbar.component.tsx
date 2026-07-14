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

const TOOLBAR_BUTTON_LEFT = 8;

const buttonContainerSx = {
    position: "absolute",
    left: TOOLBAR_BUTTON_LEFT,
    width: "38px",
    marginLeft: "auto",
    marginRight: "auto",
};

// Footprint of a single IconButton (30px icon + padding)
const TOOLBAR_BUTTON_SIZE = 46;

// Padding between the button column and the edges of the backing panel.
const BACKING_PANEL_PADDING = 4;

// Top offset of the last button in each layout
const LAST_BUTTON_TOP_WITHOUT_TOOLS = 60;
const LAST_BUTTON_TOP_WITH_TOOLS = 240;

const backingPanelSx = {
    position: "absolute",
    left: TOOLBAR_BUTTON_LEFT - BACKING_PANEL_PADDING,
    top: 8 - BACKING_PANEL_PADDING,
    width: TOOLBAR_BUTTON_SIZE + 2 * BACKING_PANEL_PADDING,
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

    const lastButtonTop = showAnnotationTools ? LAST_BUTTON_TOP_WITH_TOOLS : LAST_BUTTON_TOP_WITHOUT_TOOLS;
    const backingPanelHeight = lastButtonTop + TOOLBAR_BUTTON_SIZE;

    return (
        <>
            <Box
                sx={backingPanelSx}
                style={{ height: backingPanelHeight }}
                data-testid="editor-toolbar-backing-panel"
            />
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
                                ref={setShapesButton}
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
                    <Box sx={{ ...buttonContainerSx, top: 180 }}>
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
