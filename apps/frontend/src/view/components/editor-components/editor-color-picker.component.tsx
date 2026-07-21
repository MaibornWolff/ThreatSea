import Add from "@mui/icons-material/Add";
import { IconButton, Tooltip, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { DEFAULT_ANNOTATION_COLOR } from "#view/colors/annotation.colors.ts";
import { POA_COLORS } from "#view/colors/pointsOfAttack.colors.ts";

const keepFocusOnClick = (event: MouseEvent): void => {
    event.preventDefault();
};

// User-facing annotation color choices; intentionally hardcoded — these are picker data, not theme styling.
const PRESET_COLORS = [
    "#000000", // black
    "#e74c3c", // red
    "#3ec96a", // green
    DEFAULT_ANNOTATION_COLOR, // blue
    POA_COLORS[POINTS_OF_ATTACK.USER_BEHAVIOUR].normal, // pink
    POA_COLORS[POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE].normal, // yellow
];

interface ColorPresetChipProps {
    presetColor: string;
    selectedColor: string;
    disabled: boolean;
    onClick: (color: string) => void;
    tooltip?: string;
}

const ColorPresetChip = ({ presetColor, selectedColor, disabled, onClick, tooltip }: ColorPresetChipProps) => {
    const theme = useTheme();
    const isCurrent = selectedColor.toLowerCase() === presetColor.toLowerCase();
    const button = (
        <IconButton
            onMouseDown={keepFocusOnClick}
            onClick={() => onClick(presetColor)}
            disabled={disabled}
            sx={{ width: "20px", height: "20px", padding: 0 }}
            aria-label={presetColor}
            aria-pressed={isCurrent}
        >
            <Box
                sx={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: presetColor,
                    border: isCurrent
                        ? `2px solid ${theme.vars.palette.primary.main}`
                        : "1px solid rgba(0, 0, 0, 0.25)",
                }}
            />
        </IconButton>
    );
    if (!tooltip) {
        return button;
    }
    return (
        <Tooltip title={tooltip}>
            <Box component="span" sx={{ display: "inline-flex" }}>
                {button}
            </Box>
        </Tooltip>
    );
};

interface EditorColorPickerProps {
    color: string;
    onChange: (color: string) => void;
    onPreview?: ((color: string) => void) | undefined;
    onOpen?: (() => void) | undefined;
    disabled?: boolean;
    stacked?: boolean;
}

export const EditorColorPicker = ({
    color,
    onChange,
    onPreview,
    onOpen,
    disabled = false,
    stacked = false,
}: EditorColorPickerProps) => {
    const { t } = useTranslation("editorPage");
    const theme = useTheme();
    const customColorInputRef = useRef<HTMLInputElement>(null);

    const [previewColor, setPreviewColor] = useState<string | null>(null);

    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onPreviewRef = useRef(onPreview);
    onPreviewRef.current = onPreview;

    // Sync the prop into the uncontrolled <input type="color"> so the native
    // picker opens on the current color
    useEffect(() => {
        const input = customColorInputRef.current;
        if (input && input.value.toLowerCase() !== color.toLowerCase()) {
            input.value = color;
        }
    }, [color]);

    // "input" = local preview on every pointer move; "change" = commit to Redux.
    useEffect(() => {
        const input = customColorInputRef.current;
        if (!input) {
            return;
        }
        let frameId: number | null = null;
        let pendingValue: string | null = null;

        const flushPreview = () => {
            frameId = null;
            if (pendingValue !== null) {
                onPreviewRef.current?.(pendingValue);
            }
        };
        const handleInput = (event: Event) => {
            if (disabled) {
                return;
            }
            const value = (event.target as HTMLInputElement).value;
            setPreviewColor(value);
            pendingValue = value;
            if (frameId === null) {
                frameId = requestAnimationFrame(flushPreview);
            }
        };
        const handleChange = (event: Event) => {
            if (disabled) {
                return;
            }
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
                frameId = null;
            }
            pendingValue = null;
            setPreviewColor(null);
            onChangeRef.current((event.target as HTMLInputElement).value);
        };
        input.addEventListener("input", handleInput);
        input.addEventListener("change", handleChange);
        return () => {
            if (frameId !== null) {
                cancelAnimationFrame(frameId);
            }
            input.removeEventListener("input", handleInput);
            input.removeEventListener("change", handleChange);
            if (pendingValue !== null) {
                onChangeRef.current(pendingValue);
            }
        };
    }, [disabled]);

    const displayColor = previewColor ?? color;

    const selectedSwatch = (
        <Box
            sx={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: displayColor,
                border: `2px solid ${theme.vars.palette.border.divider}`,
                boxShadow: `0 0 0 1px rgba(${theme.vars.palette.primary.mainChannel} / 0.6)`,
            }}
        />
    );

    const chips = (
        <>
            {PRESET_COLORS.map((presetColor) => (
                <ColorPresetChip
                    key={presetColor}
                    presetColor={presetColor}
                    selectedColor={color}
                    disabled={disabled}
                    onClick={onChange}
                />
            ))}
            <Tooltip title={t("canvas.annotation.color")}>
                {/* span wrapper keeps the Tooltip listenable when the IconButton is disabled */}
                <Box component="span" sx={{ display: "inline-flex" }}>
                    <IconButton
                        onMouseDown={keepFocusOnClick}
                        onClick={() => {
                            onOpen?.();
                            customColorInputRef.current?.click();
                        }}
                        disabled={disabled}
                        sx={{
                            width: "20px",
                            height: "20px",
                            padding: 0,
                            border: `1px dashed rgba(${theme.vars.palette.primary.mainChannel} / 0.6)`,
                            color: `rgba(${theme.vars.palette.primary.mainChannel} / 0.8)`,
                        }}
                        aria-label={t("canvas.annotation.color")}
                    >
                        <Add sx={{ fontSize: 14 }} />
                    </IconButton>
                </Box>
            </Tooltip>
        </>
    );

    const hiddenInput = (
        <Box
            component="input"
            ref={customColorInputRef}
            type="color"
            defaultValue={color}
            disabled={disabled}
            sx={{
                position: "absolute",
                width: 0,
                height: 0,
                opacity: 0,
                pointerEvents: "none",
            }}
        />
    );

    if (stacked) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                {selectedSwatch}
                <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px", width: "98px" }}>
                    {chips}
                </Box>
                {hiddenInput}
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {selectedSwatch}
            {chips}
            {hiddenInput}
        </Box>
    );
};
