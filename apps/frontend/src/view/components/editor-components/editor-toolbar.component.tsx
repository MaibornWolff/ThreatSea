import {
    CenterFocusWeak,
    CropSquare,
    Download,
    ShapeLineOutlined,
    HorizontalRule,
    RadioButtonUnchecked,
    TrendingFlat,
} from "@mui/icons-material";
import { Box, IconButton, Popover, Tooltip } from "@mui/material";
import { useRef, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { EditorColorPicker } from "./editor-color-picker.component";
import type { AnnotationType } from "#api/types/system.types.ts";

interface EditorToolbarProps {
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

const ANNOTATION_TOOLS: { tool: AnnotationType; labelKey: string; Icon: ComponentType<{ sx?: object }> }[] = [
    { tool: "rect", labelKey: "canvas.annotation.rectangle", Icon: CropSquare },
    { tool: "circle", labelKey: "canvas.annotation.circle", Icon: RadioButtonUnchecked },
    { tool: "line", labelKey: "canvas.annotation.line", Icon: HorizontalRule },
    { tool: "arrow", labelKey: "canvas.annotation.arrow", Icon: TrendingFlat },
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
    const [shapesOpen, setShapesOpen] = useState(false);

    const toggleTool = (tool: AnnotationType): void => {
        onSetAnnotationTool(annotationTool === tool ? null : tool);
        setShapesOpen(false);
    };

    const isShapesActive = annotationTool !== null;

    return (
        <>
            <Box sx={{ ...buttonContainerSx, top: 8 }}>
                <IconButton onClick={onCenterEditor} sx={iconButtonSx}>
                    <CenterFocusWeak sx={iconSx} />
                </IconButton>
            </Box>
            <Box sx={{ ...buttonContainerSx, top: 60 }}>
                <Tooltip title={t("canvas.exportSystemImage")}>
                    <IconButton onClick={onDownloadSystemView} sx={iconButtonSx}>
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
                        {ANNOTATION_TOOLS.map(({ tool, labelKey, Icon }) => {
                            const isActive = annotationTool === tool;
                            return (
                                <Tooltip key={tool} title={t(labelKey)}>
                                    <IconButton
                                        onClick={() => toggleTool(tool)}
                                        sx={isActive ? activeIconButtonSx : iconButtonSx}
                                    >
                                        <Icon sx={isActive ? activeIconSx : iconSx} />
                                    </IconButton>
                                </Tooltip>
                            );
                        })}
                        <Box
                            sx={{ width: "1px", height: "28px", backgroundColor: "rgba(0,0,0,0.15)", margin: "0 4px" }}
                        />
                        <EditorColorPicker color={annotationColor} onChange={onSetAnnotationColor} />
                    </Popover>
                </>
            )}
        </>
    );
};
