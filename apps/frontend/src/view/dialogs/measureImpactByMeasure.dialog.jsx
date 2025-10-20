/**
 * @module measureImpact.dialog - Defines the dialog
 *     for the measures under risk.
 */

import {
    Box,
    Checkbox,
    DialogActions,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Tooltip,
    Typography,
} from "@mui/material";
import { Add, InfoOutlined } from "@mui/icons-material";
import SelectBoxCategorySubHeader from "../components/selectBox-CategorySubHeader";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { DialogTextField } from "../components/dialog.textfield.component";
import { useMeasureSuggestions } from "../../application/hooks/use-measureSuggestions";
import { DescriptionTextField } from "#view/components/description-textfield.component.jsx";

/**
 * Creates a dialog for the measures.
 *
 * @param {object} project - The current project data.
 * @param {boolean} measureData - The data of the measure.
 * @param {object} props - Dialog properties.
 * @returns React component for the measure dialog.
 */
const MeasureImpactByMeasureDialog = ({ project, threat, measureImpact, ...props }) => {
    const projectId = parseInt(project.id);
    const navigate = useNavigate();
    const { confirmDialog, cancelDialog, values: preselectedValues } = useDialog("measureImpacts");
    const { suggestedMeasures, appliedMeasures, filteredCatalogMeasures, remainingMeasures } = useMeasureSuggestions({
        selectedThreat: threat,
        projectId,
        catalogId: project.catalogId,
    });

    const disableSelect = !!measureImpact;

    const {
        register,
        getValues,
        setValue,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            ...measureImpact,
            id: measureImpact?.id ?? undefined,
            measureId: measureImpact?.measureId ?? "",
            description: measureImpact?.description ?? "",
            setsOutOfScope: measureImpact?.setsOutOfScope ?? false,
            impactsProbability: measureImpact?.impactsProbability ?? false,
            probability: measureImpact?.probability ?? "",
            impactsDamage: measureImpact?.impactsDamage ?? false,
            damage: measureImpact?.damage ?? "",
        },
    });

    //update when the new preselect is set
    useEffect(() => {
        setValue("measureId", preselectedValues?.measureId);
    }, [setValue, preselectedValues]);

    const [outOfScopeCheckbox, setOutOfScopeCheckbox] = useState(getValues("setsOutOfScope"));
    const [probabilityCheckbox, setProbabilityCheckbox] = useState(getValues("impactsProbability"));
    const [damageCheckbox, setDamageCheckbox] = useState(getValues("impactsDamage"));

    const { t } = useTranslation("applyMeasureDialogPage");

    /**
     * Cancel a dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Lets the user edit a measureImpact
     *
     * @event Box#onSubmit
     * @param {object} data - Data of the measure.
     */
    const handleConfirmDialog = (data) => {
        confirmDialog({
            ...data,
            probability: data.setsOutOfScope || !data.impactsProbability ? null : data.probability,
            damage: data.setsOutOfScope || !data.impactsDamage ? null : data.damage,
            threatId: parseInt(threat.id),
            projectId: parseInt(projectId),
        });
        closeDialog();
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    const handleImplementCatalogMeasure = (e, catalogMeasure) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/projects/${project.id}/risk/measures/add`, {
            state: {
                measure: {
                    active: false,
                    name: catalogMeasure.name,
                    catalogMeasureId: catalogMeasure.id,
                    description: catalogMeasure.description,
                    scheduledAt: undefined,
                    projectId: project.id,
                },
                project,
            },
        });
    };

    const handleNewBlankMeasure = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/projects/${project.id}/risk/measures/add`, {
            state: {
                measure: {
                    active: false,
                    scheduledAt: undefined,
                    projectId: project.id,
                },
                project,
            },
        });
    };

    return (
        <Dialog open={true} onBackdropClick={handleCancelDialog} maxWidth="sm" fullWidth {...props}>
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {t("applyMeasure")} {threat.name}
            </DialogTitle>
            <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column" }}
                onSubmit={handleSubmit(handleConfirmDialog)}
            >
                {disableSelect && (
                    <Typography
                        style={{
                            fontSize: "small",
                            fontStyle: "italic",
                            textAlign: "right",
                        }}
                    >
                        ID: {measureImpact.measureId}
                    </Typography>
                )}
                <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1 }}>
                    <FormControl
                        fullWidth
                        error={errors?.measureId}
                        data-testid="measureIdError"
                        sx={{
                            "&:hover fieldset": {
                                borderColor: "#fcac0c !important",
                            },
                        }}
                    >
                        <InputLabel shrink sx={{ marginLeft: 1, fontSize: "1rem" }} id="select-measureId-label">
                            {t("measure")}
                        </InputLabel>
                        <Controller
                            name="measureId"
                            control={control}
                            rules={{
                                required: t("errorMessages.measureRequired"),
                            }}
                            render={({ field: { onChange, value } }) => (
                                <Select
                                    disabled={disableSelect}
                                    labelId="select-measureId-label"
                                    id="select-measure"
                                    label={t("measure")}
                                    placeholder={t("chooseMeasure")}
                                    multiple={false}
                                    onChange={onChange}
                                    value={value}
                                    {...register("measureId", {
                                        validate: (value) => value != null,
                                        valueAsNumber: true,
                                    })}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                bgcolor: "background.mainIntransparent",
                                                borderRadius: 5,
                                                "*": {
                                                    fontSize: "0.875rem !important",
                                                },
                                            },
                                        },
                                    }}
                                    sx={{
                                        fieldset: {
                                            borderRadius: 5,
                                            borderColor: "primary.main",
                                        },
                                        legend: {
                                            marginLeft: 1,
                                            maxWidth: "100%",
                                        },
                                        ".MuiSelect-select": {
                                            paddingLeft: 3,
                                            fontSize: "0.875rem",
                                            "&:focus + input + svg + fieldset": {
                                                borderWidth: "1px !important",
                                            },
                                        },
                                        ".MuiSelect-iconOpen + fieldset": {
                                            borderWidth: "1px !important",
                                            borderColor: "#fcac0c !important",
                                        },
                                    }}
                                >
                                    <SelectBoxCategorySubHeader>
                                        <Button endIcon={<Add />} onClick={(e) => handleNewBlankMeasure(e)}>
                                            {t("newMeasure")}
                                        </Button>
                                    </SelectBoxCategorySubHeader>
                                    <SelectBoxCategorySubHeader>{t("suggestedMeasures")}:</SelectBoxCategorySubHeader>
                                    {suggestedMeasures.map((measure) => {
                                        return (
                                            <MenuItem key={measure.id} value={measure.id}>
                                                {measure.name}
                                            </MenuItem>
                                        );
                                    })}
                                    <SelectBoxCategorySubHeader>{t("catalogMeasures")}:</SelectBoxCategorySubHeader>
                                    {filteredCatalogMeasures.map((catalogMeasure) => (
                                        <MenuItem
                                            key={catalogMeasure.id}
                                            onClick={(e) => handleImplementCatalogMeasure(e, catalogMeasure)}
                                        >
                                            {catalogMeasure.name}
                                        </MenuItem>
                                    ))}
                                    <SelectBoxCategorySubHeader>{t("otherMeasures")}:</SelectBoxCategorySubHeader>
                                    {remainingMeasures.map((measure) => {
                                        return (
                                            <MenuItem key={measure.id} value={measure.id}>
                                                {measure.name}
                                            </MenuItem>
                                        );
                                    })}
                                    <SelectBoxCategorySubHeader>{t("appliedMeasures")}:</SelectBoxCategorySubHeader>
                                    {appliedMeasures.map((measure) => {
                                        return (
                                            <MenuItem key={measure.id} value={measure.id} disabled={true}>
                                                {measure.name}
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            )}
                        />
                        <FormHelperText>{errors?.measureId?.message}</FormHelperText>
                    </FormControl>
                </Box>

                <DescriptionTextField
                    register={register}
                    error={errors?.description}
                    placeholder={t("placeholder-description")}
                    rows={2}
                />
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                    }}
                >
                    <FormControlLabel
                        control={
                            <Controller
                                name={"setsOutOfScope"}
                                control={control}
                                render={({ field: props }) => (
                                    <Checkbox
                                        {...props}
                                        checked={props.value}
                                        onChange={(e) => {
                                            props.onChange(e.target.checked);
                                            setOutOfScopeCheckbox(!outOfScopeCheckbox);
                                            if (e.target.checked) {
                                                setValue("damage", "");
                                                setValue("probability", "");
                                                setValue("impactsDamage", false);
                                                setDamageCheckbox(false);
                                                setValue("impactsProbability", false);
                                                setProbabilityCheckbox(false);
                                            }
                                        }}
                                    />
                                )}
                            />
                        }
                        sx={{
                            marginBottom: 3,
                            ".MuiFormControlLabel-label": {
                                fontSize: "0.875rem",
                            },
                        }}
                        label={t("setsOutOfScope")}
                    />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <FormControlLabel
                        control={
                            <Controller
                                name={"impactsProbability"}
                                control={control}
                                render={({ field: props }) => (
                                    <Checkbox
                                        {...props}
                                        checked={props.value}
                                        disabled={outOfScopeCheckbox}
                                        onChange={(e) => {
                                            props.onChange(e.target.checked);
                                            setProbabilityCheckbox(!probabilityCheckbox);
                                        }}
                                    />
                                )}
                            />
                        }
                        sx={{
                            marginBottom: 3,
                            ".MuiFormControlLabel-label": {
                                fontSize: "0.875rem",
                            },
                        }}
                        label={t("impactsProbability")}
                    />
                    <DialogTextField
                        sx={{
                            marginLeft: 1,
                            width: 300,
                            "& .info-adornment": {
                                opacity: 0,
                                visibility: "hidden",
                                color: outOfScopeCheckbox || !probabilityCheckbox ? "grey.400" : "primary.main",
                            },
                            "&:hover .info-adornment, & .MuiOutlinedInput-root.Mui-focused .info-adornment": {
                                visibility: "visible",
                                opacity: 1,
                            },
                        }}
                        disabled={outOfScopeCheckbox || !probabilityCheckbox}
                        placeholder={threat.probability}
                        label={t("probability") + " (" + t("gross") + " " + threat.probability + ")"}
                        type="number"
                        margin="normal"
                        {...register("probability", {
                            required: {
                                value: !outOfScopeCheckbox && probabilityCheckbox,
                                message: t("errorMessages.probabilityRequired"),
                            },
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
                        error={errors?.probability}
                        helperText={errors?.probability?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip
                                        title={
                                            <>
                                                1 - {t("probabilities.1.name")} <br />{" "}
                                                {t("probabilities.1.description")} <br />
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
                                                    color: "#fcac0c !important",
                                                },
                                            }}
                                        />
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <FormControlLabel
                        control={
                            <Controller
                                name={"impactsDamage"}
                                control={control}
                                render={({ field: props }) => (
                                    <Checkbox
                                        {...props}
                                        checked={props.value}
                                        disabled={outOfScopeCheckbox}
                                        onChange={(e) => {
                                            props.onChange(e.target.checked);
                                            setDamageCheckbox(!damageCheckbox);
                                        }}
                                    />
                                )}
                            />
                        }
                        sx={{
                            marginBottom: 3,
                            ".MuiFormControlLabel-label": {
                                fontSize: "0.875rem",
                            },
                        }}
                        label={t("impactsDamage")}
                    />
                    <DialogTextField
                        sx={{
                            marginLeft: 1,
                            width: 300,
                            "& .info-adornment": {
                                opacity: 0,
                                visibility: "hidden",
                                color: outOfScopeCheckbox || !damageCheckbox ? "grey.400" : "primary.main",
                            },
                            "&:hover .info-adornment, & .MuiOutlinedInput-root.Mui-focused .info-adornment": {
                                visibility: "visible",
                                opacity: 1,
                            },
                        }}
                        disabled={outOfScopeCheckbox || !damageCheckbox}
                        placeholder={threat.damage}
                        label={t("damage") + " (" + t("gross") + " " + threat.damage + ")"}
                        type="number"
                        margin="normal"
                        {...register("damage", {
                            required: {
                                value: !outOfScopeCheckbox && damageCheckbox,
                                message: t("errorMessages.damageRequired"),
                            },
                            valueAsNumber: true,
                            min: {
                                value: 1,
                                message: t("errorMessages.damageMin"),
                            },
                            max: {
                                value: 5,
                                message: t("errorMessages.damageMax"),
                            },
                        })}
                        error={errors?.damage}
                        helperText={errors?.damage?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Tooltip
                                        title={
                                            <>
                                                1 - {t("damages.1.name")}
                                                <br />
                                                {t("damages.1.description")}
                                                <br />
                                                <br />2 - {t("damages.2.name")}
                                                <br />
                                                {t("damages.2.description")}
                                                <br />
                                                <br />3 - {t("damages.3.name")}
                                                <br />
                                                {t("damages.3.description")}
                                                <br />
                                                <br />4 - {t("damages.4.name")}
                                                <br />
                                                {t("damages.4.description")}
                                                <br />
                                                <br />5 - {t("damages.5.name")}
                                                <br />
                                                {t("damages.5.description")}
                                                <br />
                                            </>
                                        }
                                    >
                                        <InfoOutlined
                                            className="info-adornment"
                                            sx={{
                                                "&:hover": {
                                                    color: "#fcac0c !important",
                                                },
                                            }}
                                        />
                                    </Tooltip>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <DialogActions
                    sx={{
                        paddingRight: 0,
                        paddingBottom: 0,
                        paddingTop: 1.5,
                        paddingLeft: 0,
                    }}
                >
                    <Button variant="contained" sx={{ marginRight: 0 }} onClick={handleCancelDialog}>
                        {t("cancelBtn")}
                    </Button>
                    <Button type="submit" sx={{ marginRight: 0 }} variant="contained" color="success">
                        {t("saveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default MeasureImpactByMeasureDialog;
