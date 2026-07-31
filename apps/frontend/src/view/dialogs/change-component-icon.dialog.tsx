import { type ChangeEvent, useState } from "react";
import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import { Avatar, Box, ButtonBase, DialogActions, DialogTitle, Tooltip, Typography } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { useTranslation } from "react-i18next";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { ACCEPTED_ICON_MIME_TYPES, validateAndConvertIconFile } from "#utils/files.ts";
import { STANDARD_ICON_IMAGES, standardIconTypeForSymbol } from "#view/icons/standard-icons.ts";
import { STANDARD_COMPONENT_TYPES } from "#api/types/standard-component.types.ts";
import { Button } from "#view/components/button.component.tsx";
import { Dialog } from "#view/components/dialog.component.tsx";
import type { AugmentedSystemComponent } from "#api/types/system.types.ts";

interface ChangeComponentIconDialogProps extends Omit<DialogProps, "component" | "open"> {
    component: AugmentedSystemComponent;
    onClose: () => void;
    onConfirm: (symbol: string) => void;
}

// All standard icons offered (any placed component can use any). Labels reuse context-menu keys.
const STANDARD_ICON_OPTIONS: { type: STANDARD_COMPONENT_TYPES; labelKey: string }[] = [
    { type: STANDARD_COMPONENT_TYPES.USERS, labelKey: "contextMenu.Users" },
    { type: STANDARD_COMPONENT_TYPES.CLIENT, labelKey: "contextMenu.Client" },
    { type: STANDARD_COMPONENT_TYPES.SERVER, labelKey: "contextMenu.Server" },
    { type: STANDARD_COMPONENT_TYPES.DATABASE, labelKey: "contextMenu.Database" },
    {
        type: STANDARD_COMPONENT_TYPES.COMMUNICATION_INFRASTRUCTURE,
        labelKey: "contextMenu.Communication Infrastructure",
    },
];

const iconTileSx = (selected: boolean) => ({
    width: 48,
    height: 48,
    p: 1,
    borderRadius: "50%",
    border: selected ? "2px solid" : "1px solid",
    borderColor: selected ? "primary.main" : "divider",
    backgroundColor: selected ? "primary.light" : "transparent",
    color: "text.secondary",
    transition: "border-color 120ms, background-color 120ms",
    "&:hover": {
        borderColor: "primary.main",
    },
    "&.Mui-focusVisible": {
        outline: "2px solid",
        outlineColor: "primary.main",
        outlineOffset: "2px",
    },
    // `contain` shows wide icons whole instead of the Avatar's default cover.
    "& .MuiAvatar-img": { objectFit: "contain" },
});

/**
 * Dialog to override one placed component's icon (#577). Returns the chosen icon (standard or
 * validated upload) via `onConfirm` as a data URL; the caller applies it to that instance only.
 */
const ChangeComponentIconDialog = ({ component, onClose, onConfirm, ...props }: ChangeComponentIconDialogProps) => {
    const { t } = useTranslation("editorPage");
    const { openConfirm } = useConfirm();
    const [selectedSymbol, setSelectedSymbol] = useState<string>(component.symbol ?? "");

    // Detect custom by icon identity, not string equality (symbol form varies by build).
    const isCustomSelected = selectedSymbol !== "" && standardIconTypeForSymbol(selectedSymbol) === null;

    const handleSelectFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) {
            return;
        }
        const result = await validateAndConvertIconFile(file);
        if (!result.ok) {
            openConfirm({
                message: t("customComponent.fileUnusable"),
                acceptText: t("okBtn"),
                cancelText: null,
                onAccept: () => {
                    /* Do nothing */
                },
            });
            return;
        }
        setSelectedSymbol(result.dataUrl);
    };

    const handleSave = () => {
        if (selectedSymbol === "") {
            return;
        }
        onConfirm(selectedSymbol);
        onClose();
    };

    return (
        <Dialog onClose={onClose} fullWidth={false} {...props} open={true}>
            <DialogTitle sx={{ padding: 0, fontSize: "0.875rem", fontWeight: "bold", mb: 1 }}>
                {t("changeComponentIcon.title")}
            </DialogTitle>
            <Typography color="text.secondary" sx={{ fontSize: "0.75rem", mb: 2 }}>
                {t("changeComponentIcon.appliesTo", { name: component.name })}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 2 }}>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                        {t("customComponent.iconStandardLabel")}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1 }}>
                        {STANDARD_ICON_OPTIONS.map((option) => {
                            const image = STANDARD_ICON_IMAGES[option.type];
                            const isSelected = standardIconTypeForSymbol(selectedSymbol) === option.type;
                            const iconLabel = t(option.labelKey);
                            return (
                                <ButtonBase
                                    key={option.type}
                                    onClick={() => setSelectedSymbol(image)}
                                    aria-label={iconLabel}
                                    aria-pressed={isSelected}
                                    sx={iconTileSx(isSelected)}
                                >
                                    <Avatar
                                        src={image}
                                        alt={iconLabel}
                                        variant="square"
                                        sx={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
                                    />
                                </ButtonBase>
                            );
                        })}
                    </Box>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mx: 2 }}>
                    <Typography variant="caption" aria-hidden sx={{ mb: 0.5, visibility: "hidden" }}>
                        &nbsp;
                    </Typography>
                    <Box sx={{ height: 48, display: "flex", alignItems: "center" }}>
                        <Typography color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                            {t("customComponent.iconOr")}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                        {t("customComponent.iconUploadLabel")}
                    </Typography>
                    <Tooltip title={t("customComponent.iconUploadTooltip")}>
                        <ButtonBase
                            component="label"
                            aria-label={t("customComponent.iconUploadTooltip")}
                            aria-pressed={isCustomSelected}
                            sx={iconTileSx(isCustomSelected)}
                        >
                            <input
                                type="file"
                                hidden
                                accept={ACCEPTED_ICON_MIME_TYPES}
                                onChange={handleSelectFile}
                                onClick={(event) => {
                                    event.currentTarget.value = "";
                                }}
                            />
                            <Avatar
                                src={isCustomSelected ? selectedSymbol : undefined}
                                variant="square"
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    backgroundColor: "transparent",
                                    color: "text.secondary",
                                }}
                            >
                                {!isCustomSelected && <AddPhotoAlternateOutlined fontSize="small" />}
                            </Avatar>
                        </ButtonBase>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.5rem" }}>
                        {t("customComponent.iconUploadHint")}
                    </Typography>
                </Box>
            </Box>

            <DialogActions sx={{ padding: 0, marginTop: 1 }}>
                <Button onClick={onClose} sx={{ marginLeft: 0, marginRight: 0 }}>
                    {t("cancelBtn")}
                </Button>
                <Button
                    onClick={handleSave}
                    color="success"
                    disabled={selectedSymbol === ""}
                    sx={{ marginRight: 0 }}
                    data-testid="save-component-icon"
                >
                    {t("saveBtn")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ChangeComponentIconDialog;
