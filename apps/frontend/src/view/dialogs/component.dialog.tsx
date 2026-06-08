/**
 * @module component.dialog - Defines the dialog
 *     for the custom components.
 */

import { AddPhotoAlternateOutlined } from "@mui/icons-material";
import {
    Avatar,
    Box,
    ButtonBase,
    DialogActions,
    DialogTitle,
    Divider,
    FormControlLabel,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import type { StandardIcon } from "#api/types/standard-component.types.ts";
import { POA_COLORS } from "#view/colors/pointsOfAttack.colors.ts";
import {
    SELECTABLE_STANDARD_ICONS,
    STANDARD_ICON_IMAGES,
    STANDARD_ICON_LABEL_KEYS,
} from "#view/icons/standard-icons.ts";
import { useDialog } from "#application/hooks/use-dialog.hook.ts";
import { ACCEPTED_ICON_MIME_TYPES, MAX_ICON_BYTES, convertFileToBase64 } from "#utils/files.ts";
import { Button } from "#view/components/button.component.tsx";
import { Dialog } from "#view/components/dialog.component.tsx";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { NameTextField } from "#view/components/name-textfield.component.tsx";
import { useState, type ChangeEvent } from "react";
import type { ComponentType } from "#api/types/component-types.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

type ComponentPointsOfAttackMap = Partial<Record<POINTS_OF_ATTACK, boolean>>;

interface ComponentFormValues extends DialogValue {
    id: number | undefined;
    name: string;
    symbol: string | null;
    standardIcon: StandardIcon | null;
    isProjectComponent: boolean;
    pointsOfAttackSelection: ComponentPointsOfAttackMap;
    pointsOfAttack?: POINTS_OF_ATTACK[];
}

interface ComponentDialogProps extends Omit<DialogProps, "component"> {
    component: ComponentType | undefined;
}

/**
 * Filtered points of attack, without the communication vectors.
 */
const COMPONENT_POINTS_OF_ATTACK = Object.values(POINTS_OF_ATTACK).filter(
    (type) =>
        type !== POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE && type !== POINTS_OF_ATTACK.COMMUNICATION_INTERFACES
);

/**
 * Creates a dialog for the custom components.
 *
 * @param {boolean} component - The custom component, when editing it.
 * @param {object} props - Dialog properties.
 * @returns React component for the custom components dialog.
 */
const ComponentDialog = ({ component, ...props }: ComponentDialogProps) => {
    const { confirmDialog, cancelDialog } = useDialog<ComponentFormValues | null>("components");
    const navigate = useNavigate();
    const { openConfirm } = useConfirm();
    const { t } = useTranslation("editorPage");
    const { projectId: projectIdParam } = useParams();
    const projectId = projectIdParam ? parseInt(projectIdParam, 10) : NaN;

    const [noPOAError, setNoPOAError] = useState(false);
    const [noIconError, setNoIconError] = useState(false);

    const getDefaultPointsOfAttackSelection = (selected: POINTS_OF_ATTACK[] = []): ComponentPointsOfAttackMap => {
        return COMPONENT_POINTS_OF_ATTACK.reduce((acc, pointOfAttack) => {
            acc[pointOfAttack] = selected.includes(pointOfAttack);
            return acc;
        }, {} as ComponentPointsOfAttackMap);
    };

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        formState: { errors },
    } = useForm<ComponentFormValues>({
        defaultValues: component
            ? {
                  id: component.id,
                  name: component.name,
                  symbol: component.standardIcon != null ? null : component.symbol,
                  standardIcon: component.standardIcon ?? null,
                  isProjectComponent: !!component.projectId,
                  pointsOfAttackSelection: getDefaultPointsOfAttackSelection(component.pointsOfAttack ?? []),
              }
            : {
                  name: "",
                  symbol: null,
                  standardIcon: null,
                  isProjectComponent: true,
                  pointsOfAttackSelection: getDefaultPointsOfAttackSelection(),
              },
    });

    const selectedStandardIcon = watch("standardIcon");
    const uploadedSymbol = watch("symbol");
    const isCustomSelected = uploadedSymbol != null && uploadedSymbol !== "";

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
    });

    /**
     * Cancel a dialog and closes it.
     * @event Dialog#onBackdropClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Adds or changes a custom component.
     *
     * @event Box#onSubmit
     * @param {object} pointsOfAttackSelection - Keeps track which points of attack were selected.
     * @param {boolean} isProjectComponent - Indicator if the component is bound
     *      to this project.
     * @param {object} data - Data of the component.
     */
    const handleConfirmDialog = ({
        pointsOfAttackSelection,
        isProjectComponent: _isProjectComponent,
        ...data
    }: ComponentFormValues) => {
        const hasIcon = data.standardIcon != null || (data.symbol != null && data.symbol !== "");
        if (!hasIcon) {
            setNoIconError(true);
            return;
        } else {
            setNoIconError(false);
        }

        if (!Object.values(pointsOfAttackSelection).some((el) => el === true)) {
            setNoPOAError(true);
            return;
        } else {
            setNoPOAError(false);
        }

        confirmDialog({
            ...data,
            symbol: data.standardIcon != null ? null : data.symbol,
            projectId: projectId,
            pointsOfAttack: Object.keys(pointsOfAttackSelection).reduce<POINTS_OF_ATTACK[]>((arr, id) => {
                const pointOfAttack = pointsOfAttackSelection[id as POINTS_OF_ATTACK];
                if (pointOfAttack) {
                    arr.push(id as POINTS_OF_ATTACK);
                }
                return arr;
            }, []),
        });
        closeDialog();
    };

    /**
     * Reads the selected symbol image and converts it
     * to base64.
     *
     * @event FileUploadButton#onChange
     * @param {SyntheticBaseEvent} event - onChange Event.
     */
    const handleSelectSymbol = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.currentTarget.files?.[0];
        if (!file) {
            return;
        }
        const isAcceptedType = ACCEPTED_ICON_MIME_TYPES.split(",").includes(file.type);
        if (!isAcceptedType || file.size > MAX_ICON_BYTES) {
            openConfirm({
                message: t("customComponent.fileUnusable"),
                acceptText: "Okay",
                cancelText: null,
                onAccept: () => {
                    /* Do nothing */
                },
            });
        } else {
            const symbol = (await convertFileToBase64(file)) as string | undefined;
            setValue("symbol", symbol ?? "", { shouldValidate: true });
            setValue("standardIcon", null);
            setNoIconError(false);
        }
    };

    const handleSelectStandardIcon = (icon: StandardIcon) => {
        if (selectedStandardIcon === icon) {
            return;
        }
        setValue("standardIcon", icon);
        setValue("symbol", null);
        setNoIconError(false);
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    return (
        <Dialog
            onClose={(_event, reason) => {
                if (reason === "backdropClick") {
                    handleCancelDialog?.();
                }
            }}
            fullWidth={false}
            {...props}
            open={true}
        >
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {component ? t("customComponent.editComponent") : t("customComponent.addComponent")}
            </DialogTitle>
            <Box
                component="form"
                onSubmit={handleSubmit(handleConfirmDialog)}
                sx={{ display: "flex", flexDirection: "column" }}
            >
                <NameTextField
                    register={register}
                    error={errors?.name}
                    ownId={component?.id}
                    type="component"
                    projectId={projectId}
                />

                <Typography sx={{ fontSize: "0.875rem", fontWeight: "bold", mt: 2, mb: 1 }}>
                    {t("customComponent.iconLabel")}
                </Typography>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1,
                        mb: 2,
                    }}
                >
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                            {t("customComponent.iconStandardLabel")}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            {SELECTABLE_STANDARD_ICONS.map((icon) => {
                                const isSelected = selectedStandardIcon === icon;
                                const iconLabel = t(`contextMenu.${STANDARD_ICON_LABEL_KEYS[icon]}`);
                                return (
                                    <ButtonBase
                                        key={icon}
                                        onClick={() => handleSelectStandardIcon(icon)}
                                        aria-label={iconLabel}
                                        aria-pressed={isSelected}
                                        sx={iconTileSx(isSelected)}
                                    >
                                        <Avatar
                                            src={STANDARD_ICON_IMAGES[icon]}
                                            alt={iconLabel}
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
                                    onChange={handleSelectSymbol}
                                    onClick={(event) => {
                                        event.currentTarget.value = "";
                                    }}
                                />
                                <Avatar
                                    src={isCustomSelected ? (uploadedSymbol ?? undefined) : undefined}
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
                {noIconError && (
                    <Typography variant="caption" color="error" sx={{ marginLeft: 1, mb: 1 }}>
                        {t("customComponent.iconRequired")}
                    </Typography>
                )}
                <Divider />
                {COMPONENT_POINTS_OF_ATTACK.map((type, i) => {
                    return (
                        <Box
                            key={i}
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 1,
                                paddingLeft: "2px",
                                paddingRight: "2px",
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Controller
                                        name={`pointsOfAttackSelection.${type}`}
                                        control={control}
                                        render={({ field }) => <Switch {...field} checked={!!field?.value} />}
                                    />
                                }
                                label={
                                    <Typography sx={{ fontSize: "0.875rem" }}>
                                        {t(`pointsOfAttackList.${type}`)}
                                    </Typography>
                                }
                            />
                            <Box
                                sx={{
                                    backgroundColor: POA_COLORS[type].normal,
                                    width: "16px",
                                    height: "16px",
                                    marginLeft: 1,
                                    borderRadius: 50,
                                }}
                            ></Box>
                        </Box>
                    );
                })}
                {noPOAError && (
                    <Typography variant="caption" color="error" sx={{ marginLeft: 1 }}>
                        {t("communicationInterface.poaRequired")}
                    </Typography>
                )}

                <DialogActions sx={{ padding: 0, marginTop: 2 }}>
                    <Button
                        onClick={handleCancelDialog}
                        sx={{
                            marginLeft: 0,
                            marginRight: 0,
                        }}
                    >
                        {t("cancelBtn")}
                    </Button>
                    <Button type="submit" color="success" sx={{ marginRight: 0 }}>
                        {t("saveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default ComponentDialog;
