import { useState } from "react";
import {
    Box,
    Collapse,
    FormControl,
    FormControlLabel,
    FormGroup,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import { ChevronRight, ExpandMore, InfoOutlined } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BoxNameTextField } from "#view/components/name-textfield.component.tsx";
import { DescriptionTextField } from "#view/components/description-textfield.component.tsx";
import { DialogTextField } from "#view/components/dialog.textfield.component.tsx";
import { ThreatRiskPreview } from "#view/components/threat-risk-preview.component.tsx";
import { calcDamage } from "#utils/helpers.ts";
import { calcNetRisk, calcRiskColour } from "#utils/calcRisk.ts";
import type { Asset } from "#api/types/asset.types.ts";
import type { ThreatMeasure } from "#application/hooks/use-threat-measures-list.hook.ts";
import type { ThreatFormValues } from "./add-threat-form.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";

interface AddThreatMainTabProps {
    active: boolean;
    threatId: number;
    assets: Asset[];
    lineOfToleranceGreen: number;
    lineOfToleranceRed: number;
    allThreatMeasures: ThreatMeasure[];
    register: UseFormRegister<ThreatFormValues>;
    control: Control<ThreatFormValues>;
    errors: FieldErrors<ThreatFormValues>;
    genericThreatDescription: string;
}

export const AddThreatMainTab = ({
    active,
    threatId,
    assets,
    lineOfToleranceGreen,
    lineOfToleranceRed,
    allThreatMeasures,
    register,
    control,
    errors,
    genericThreatDescription,
}: AddThreatMainTabProps) => {
    const { t } = useTranslation("threatDialogPage");
    const theme = useTheme();
    const [showGenericDescription, setShowGenericDescription] = useState(false);

    const watchedConfidentiality = useWatch({ control, name: "confidentiality" });
    const watchedIntegrity = useWatch({ control, name: "integrity" });
    const watchedAvailability = useWatch({ control, name: "availability" });
    const watchedProbability = useWatch({ control, name: "probability" });

    const grossDamage = calcDamage({
        assets,
        confidentiality: !!watchedConfidentiality,
        integrity: !!watchedIntegrity,
        availability: !!watchedAvailability,
    });
    // The probability field is not hard-capped while typing, so clamp the value used
    // for the live preview to the 1–5 risk scale (0 keeps the empty/invalid state grey).
    const probabilityValue = Math.min(Math.max(Number(watchedProbability) || 0, 0), 5);
    const grossRisk = probabilityValue * grossDamage;
    const { netProbability, netDamage, netRisk } = calcNetRisk(
        probabilityValue,
        grossDamage,
        allThreatMeasures.map((threatMeasure) => threatMeasure.measureImpact)
    );
    const grossColor = calcRiskColour(grossDamage, probabilityValue, lineOfToleranceGreen, lineOfToleranceRed);
    const netColor = calcRiskColour(netDamage, netProbability, lineOfToleranceGreen, lineOfToleranceRed);

    return (
        <Box
            sx={{
                display: active ? "flex" : "none",
                flexDirection: "column",
            }}
        >
            <Typography
                style={{
                    fontSize: "small",
                    fontStyle: "italic",
                    textAlign: "right",
                }}
            >
                ID: {threatId}
            </Typography>

            <BoxNameTextField register={register} error={errors?.name} margin="normal" data-testid="EditThreatName" />

            <DescriptionTextField register={register} error={errors?.description} data-testid="EditThreatDescription" />

            <Box sx={{ mt: 0.5 }}>
                <Box
                    role="button"
                    tabIndex={0}
                    aria-expanded={showGenericDescription}
                    onClick={() => setShowGenericDescription((shown) => !shown)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setShowGenericDescription((shown) => !shown);
                        }
                    }}
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.5,
                        cursor: "pointer",
                        color: "text.secondary",
                        userSelect: "none",
                    }}
                    data-testid="GenericThreatDescriptionToggle"
                >
                    {showGenericDescription ? (
                        <ExpandMore sx={{ fontSize: 18 }} />
                    ) : (
                        <ChevronRight sx={{ fontSize: 18 }} />
                    )}
                    <InfoOutlined sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: "0.875rem" }}>{t("genericThreatDescription")}</Typography>
                </Box>
                <Collapse in={showGenericDescription}>
                    <Typography
                        data-testid="GenericThreatDescriptionText"
                        sx={{
                            fontSize: "0.875rem",
                            whiteSpace: "pre-wrap",
                            color: "text.secondary",
                            mt: 0.5,
                            ml: 3,
                        }}
                    >
                        {genericThreatDescription}
                    </Typography>
                </Collapse>
            </Box>

            <DialogTextField
                sx={{
                    "& .info-adornment": {
                        opacity: 0,
                        visibility: "hidden",
                        color: "primary.main",
                    },
                    "&:hover .info-adornment, & .MuiOutlinedInput-root.Mui-focused .info-adornment": {
                        visibility: "visible",
                        opacity: 1,
                    },
                }}
                type="number"
                label={t("probability")}
                margin="normal"
                defaultValue={1}
                min={1}
                max={5}
                {...register("probability", {
                    required: t("errorMessages.probabilityRequired"),
                    valueAsNumber: true,
                    min: {
                        value: 1,
                        message: t("errorMessages.probabilityMin"),
                    },
                    max: {
                        value: 5,
                        message: t("errorMessages.probabilityMax"),
                    },
                })}
                error={!!errors?.probability}
                helperText={errors?.probability?.message}
                data-testid="EditThreatProbability"
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip
                                    title={
                                        <>
                                            1 - {t("probabilities.1.name")} <br /> {t("probabilities.1.description")}{" "}
                                            <br />
                                            <br />2 - {t("probabilities.2.name")} <br />{" "}
                                            {t("probabilities.2.description")} <br />
                                            <br />3 - {t("probabilities.3.name")} <br />{" "}
                                            {t("probabilities.3.description")} <br />
                                            <br />4 - {t("probabilities.4.name")} <br />{" "}
                                            {t("probabilities.4.description")} <br />
                                            <br />5 - {t("probabilities.5.name")} <br />{" "}
                                            {t("probabilities.5.description")} <br />
                                        </>
                                    }
                                >
                                    <InfoOutlined
                                        className="info-adornment"
                                        sx={{
                                            "&:hover": {
                                                color: `${theme.vars.palette.secondary.main} !important`,
                                            },
                                        }}
                                    />
                                </Tooltip>
                            </InputAdornment>
                        ),
                    },
                }}
            />

            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Controller
                                control={control}
                                render={({ field }) => <Switch {...field} checked={!!field?.value} />}
                                {...register("confidentiality")}
                                name="confidentiality"
                            />
                        }
                        label={t("C")}
                        labelPlacement="start"
                        sx={{
                            ".MuiFormControlLabel-label": {
                                fontSize: "0.875rem",
                            },
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Controller
                                control={control}
                                render={({ field }) => <Switch {...field} checked={!!field?.value} />}
                                {...register("integrity")}
                                name="integrity"
                            />
                        }
                        label={t("I")}
                        labelPlacement="start"
                        sx={{
                            ".MuiFormControlLabel-label": {
                                fontSize: "0.875rem",
                            },
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Controller
                                control={control}
                                render={({ field }) => <Switch {...field} checked={!!field?.value} />}
                                {...register("availability")}
                                name="availability"
                            />
                        }
                        label={t("A")}
                        labelPlacement="start"
                        sx={{
                            ".MuiFormControlLabel-label": {
                                fontSize: "0.875rem",
                            },
                        }}
                    />
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel id="threat-status-label">{t("status")}</InputLabel>
                        <Controller
                            control={control}
                            name="status"
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    labelId="threat-status-label"
                                    label={t("status")}
                                    data-testid="ThreatStatusSelect"
                                >
                                    {Object.values(THREAT_STATUSES).map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {t(`statusList.${status}`)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            )}
                        />
                    </FormControl>
                </FormGroup>
                <ThreatRiskPreview
                    grossRisk={grossRisk}
                    grossColor={grossColor}
                    netRisk={netRisk}
                    netColor={netColor}
                />
            </Box>
        </Box>
    );
};
