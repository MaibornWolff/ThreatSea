import { IconButton, Tooltip } from "@mui/material";
import { Box } from "@mui/system";
import { useTranslation } from "react-i18next";
import { DEFAULT_ANNOTATION_COLOR } from "../../../application/hooks/use-annotation-drawing.hook";
import { POA_COLORS } from "../../colors/pointsOfAttack.colors";

const POA_PALETTE = Object.entries(POA_COLORS)
    .map(([poaType, palette]) => ({ poaType, color: palette.normal }))
    .filter((entry) => entry.color.toLowerCase() !== DEFAULT_ANNOTATION_COLOR.toLowerCase());

interface EditorColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    disabled?: boolean;
}

export const EditorColorPicker = ({ color, onChange, disabled = false }: EditorColorPickerProps) => {
    const { t } = useTranslation("editorPage");

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Tooltip title={t("canvas.annotation.color")}>
                <Box
                    component="label"
                    sx={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        cursor: disabled ? "not-allowed" : "pointer",
                        backgroundColor: color,
                        border: "2px solid #ffffff",
                        boxShadow: "0 0 0 1px rgba(35, 60, 87, 0.6)",
                    }}
                >
                    <Box
                        component="input"
                        type="color"
                        value={color}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            !disabled && onChange(event.target.value)
                        }
                        disabled={disabled}
                        sx={{
                            position: "absolute",
                            width: 0,
                            height: 0,
                            opacity: 0,
                            pointerEvents: "none",
                        }}
                    />
                </Box>
            </Tooltip>
            <Tooltip title={t("canvas.annotation.defaultColor")}>
                <IconButton
                    onClick={() => onChange(DEFAULT_ANNOTATION_COLOR)}
                    disabled={disabled}
                    sx={{ width: "20px", height: "20px", padding: 0 }}
                    aria-label={DEFAULT_ANNOTATION_COLOR}
                >
                    <Box
                        sx={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            backgroundColor: DEFAULT_ANNOTATION_COLOR,
                            border:
                                color.toLowerCase() === DEFAULT_ANNOTATION_COLOR.toLowerCase()
                                    ? "2px solid rgba(35, 60, 87, 1)"
                                    : "1px solid rgba(0,0,0,0.25)",
                        }}
                    />
                </IconButton>
            </Tooltip>

            {POA_PALETTE.map(({ poaType, color: presetColor }) => {
                const isCurrent = color.toLowerCase() === presetColor.toLowerCase();
                return (
                    <IconButton
                        key={poaType}
                        onClick={() => onChange(presetColor)}
                        disabled={disabled}
                        sx={{ width: "20px", height: "20px", padding: 0 }}
                        aria-label={presetColor}
                    >
                        <Box
                            sx={{
                                width: "16px",
                                height: "16px",
                                borderRadius: "50%",
                                backgroundColor: presetColor,
                                border: isCurrent ? "2px solid rgba(35, 60, 87, 1)" : "1px solid rgba(0,0,0,0.25)",
                            }}
                        />
                    </IconButton>
                );
            })}
        </Box>
    );
};
