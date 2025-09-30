/**
 * @module catalog-measure.dialog - Defines the dialog
 *     for the catalogue measures.
 */

import {
    Box,
    DialogActions,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    Switch,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ATTACKERS } from "../../api/types/attackers.types";
import { POINTS_OF_ATTACK } from "../../api/types/points-of-attack.types";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { DialogTextField } from "../components/dialog.textfield.component";
import { NameTextField } from "../components/name-textfield.component";
import { DescriptionTextField } from "#view/components/description-textfield.component.jsx";

/**
 * Creates a dialog for the catalogue measures.
 *
 * @param {number} projectId - id of the current project.
 * @param {object} catalogMeasure - The measure data.
 * @param {boolean} isNew - Indicator if the measure is a new one to be added.
 * @param {object} props - Dialog properties.
 * @returns React component for the catalogue measures dialog.
 */
const CatalogMeasureDialog = ({ catalogMeasure, isNew, catalogId, ...props }) => {
    const { cancelDialog, confirmDialog } = useDialog("catalogMeasures");
    const navigate = useNavigate();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            ...catalogMeasure,
            id: catalogMeasure?.id ?? undefined,
            name: catalogMeasure?.name ?? "",
            description: catalogMeasure?.description ?? "",
            attacker: catalogMeasure?.attacker ?? null,
            pointOfAttack: catalogMeasure?.pointOfAttack ?? null,
            probability: catalogMeasure?.probability ?? "",
            confidentiality: catalogMeasure?.confidentiality ?? false,
            integrity: catalogMeasure?.integrity ?? false,
            availability: catalogMeasure?.availability ?? false,
        },
    });

    const { t } = useTranslation("catalogPage", "catalogMeasureDialogPage");

    /**
     * Closes the dialog window.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    /**
     * Adds or changes a catalogue measure.
     *
     * @event Box#onSubmit
     * @param {object} catalogMeasure - Data of the catalogue measure
     *     from the dialog.
     */
    const handleConfirmDialog = (catalogMeasure) => {
        const { probability, ...data } = catalogMeasure;

        if (isNew) {
            const { attacker, pointOfAttack, ...rest } = data;
            attacker.forEach((attacker) => {
                pointOfAttack.forEach((pointOfAttack) => {
                    confirmDialog({
                        ...rest,
                        attacker,
                        pointOfAttack,
                        probability: parseInt(probability),
                    });
                });
            });
        } else {
            confirmDialog({
                ...data,
                probability: parseInt(probability),
            });
        }

        closeDialog();
    };

    /**
     * Cancel a dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
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
                {isNew ? t("addMeasure") : t("editMeasure")}
            </DialogTitle>
            <Box
                component="form"
                onSubmit={handleSubmit(handleConfirmDialog)}
                sx={{ display: "flex", flexDirection: "column" }}
            >
                <NameTextField
                    register={register}
                    error={errors?.name}
                    ownId={catalogMeasure?.id}
                    type="measure"
                    catalogId={catalogId}
                    data-testid="catalog-measure-creation-modal_name-input"
                />

                <DescriptionTextField
                    register={register}
                    error={errors?.description}
                    data-testid="catalog-measure-creation-modal_description-input"
                />

                <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1 }}>
                    <FormControl
                        fullWidth
                        error={errors?.attacker}
                        data-testid="AttackerError"
                        sx={{
                            mr: 1,
                            "&:hover fieldset": {
                                borderColor: "#fcac0c !important",
                            },
                        }}
                    >
                        <InputLabel shrink sx={{ marginLeft: 1, fontSize: "1rem" }} id="select-attacker-label">
                            {t("attackersHeading")}
                        </InputLabel>
                        <Controller
                            name="attacker"
                            control={control}
                            rules={{
                                required: t("errorMessages.attakerRequired"),
                            }}
                            render={({ field }) => (
                                <Select
                                    labelId="select-attacker-label"
                                    id="select-attacker"
                                    label={t("attackersHeading")}
                                    {...field}
                                    multiple={isNew}
                                    {...register("attacker", {
                                        validate: (value) => value.length > 0,
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
                                    data-testid="catalog-measure-creation-modal_attacker-selection"
                                >
                                    <MenuItem
                                        value={ATTACKERS.UNAUTHORISED_PARTIES}
                                        data-testid="catalog-measure-creation-modal_attacker-selection_un-par"
                                    >
                                        {t("attackerList.UNAUTHORISED_PARTIES")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.SYSTEM_USERS}
                                        data-testid="catalog-measure-creation-modal_attacker-selection_sys-us"
                                    >
                                        {t("attackerList.SYSTEM_USERS")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.APPLICATION_USERS}
                                        data-testid="catalog-measure-creation-modal_attacker-selection_app-us"
                                    >
                                        {t("attackerList.APPLICATION_USERS")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.ADMINISTRATORS}
                                        data-testid="catalog-measure-creation-modal_attacker-selection_adm-us"
                                    >
                                        {t("attackerList.ADMINISTRATORS")}
                                    </MenuItem>
                                </Select>
                            )}
                        />
                        <FormHelperText>{errors?.attacker?.message}</FormHelperText>
                    </FormControl>

                    <FormControl
                        fullWidth
                        error={errors?.pointOfAttack}
                        data-testid="PoAError"
                        sx={{
                            "&:hover fieldset": {
                                borderColor: "#fcac0c !important",
                            },
                        }}
                    >
                        <InputLabel shrink sx={{ marginLeft: 1, fontSize: "1rem" }} id="select-points-of-attack-label">
                            {t("pointsOfAttackHeading")}
                        </InputLabel>
                        <Controller
                            name="pointOfAttack"
                            control={control}
                            rules={{
                                required: t("errorMessages.pointOfAttackRequired"),
                            }}
                            render={({ field }) => (
                                <Select
                                    labelId="select-points-of-attack-label"
                                    id="select-points-of-attacker"
                                    label={t("pointsOfAttackHeading")}
                                    {...field}
                                    multiple={isNew}
                                    {...register("pointOfAttack", {
                                        validate: (value) => value.length > 0,
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
                                    data-testid="catalog-measure-creation-modal_poa-selection"
                                >
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE}
                                        data-testid="catalog-measure-creation-modal_PoA-selection_da-sto-infra"
                                    >
                                        {t("pointsOfAttackList.DATA_STORAGE_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE}
                                        data-testid="catalog-measure-creation-modal_PoA-selection_pro-infra"
                                    >
                                        {t("pointsOfAttackList.PROCESSING_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE}
                                        data-testid="catalog-measure-creation-modal_PoA-selection_com-infra"
                                    >
                                        {t("pointsOfAttackList.COMMUNICATION_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.COMMUNICATION_INTERFACES}
                                        data-testid="catalog-measure-creation-modal_PoA-selection_com-inter"
                                    >
                                        {t("pointsOfAttackList.COMMUNICATION_INTERFACES")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.USER_INTERFACE}
                                        data-testid="catalog-measure-creation-modal_PoA-selection_us-inter"
                                    >
                                        {t("pointsOfAttackList.USER_INTERFACE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.USER_BEHAVIOUR}
                                        data-testid="catalog-measure-creation-modal_PoA-selection_us-beh"
                                    >
                                        {t("pointsOfAttackList.USER_BEHAVIOUR")}
                                    </MenuItem>
                                </Select>
                            )}
                        />
                        <FormHelperText>{errors?.pointOfAttack?.message}</FormHelperText>
                    </FormControl>
                </Box>
                <DialogTextField
                    label={t("probability")}
                    type="number"
                    margin="normal"
                    {...register("probability", {
                        required: t("catalogMeasureDialogPage:errorMessages.probabilityRequired"),
                        valueAsNumber: true,
                        min: {
                            value: 1,
                            message: t("catalogMeasureDialogPage:errorMessages.probabilityMin"),
                        },
                        max: {
                            value: 5,
                            message: t("catalogMeasureDialogPage:errorMessages.probabilityMax"),
                        },
                    })}
                    error={errors?.probability}
                    helperText={errors?.probability?.message}
                    data-testid="catalog-measure-creation-modal_probability-input"
                />
                <Box display="flex" alignItems="center">
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Controller
                                    name="confidentiality"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            {...field}
                                            checked={field?.value}
                                            data-testid="catalog-measure-creation-modal_confidentiality-switch"
                                        />
                                    )}
                                    {...register("confidentiality", {
                                        value: false,
                                    })}
                                    data-testid="catalog-measure-creation-modal_confidentiality-switch"
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
                                    name="integrity"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            {...field}
                                            checked={field?.value}
                                            data-testid="catalog-measure-creation-modal_integrity-switch"
                                        />
                                    )}
                                    {...register("integrity", {
                                        value: false,
                                    })}
                                    data-testid="catalog-measure-creation-modal_integrity-switch"
                                />
                            }
                            sx={{
                                ".MuiFormControlLabel-label": {
                                    fontSize: "0.875rem",
                                },
                            }}
                            label={t("I")}
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            control={
                                <Controller
                                    name="availability"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            {...field}
                                            checked={field?.value}
                                            data-testid="catalog-measure-creation-modal_availability-switch"
                                        />
                                    )}
                                    {...register("availability", {
                                        value: false,
                                    })}
                                    data-testid="catalog-measure-creation-modal_availability-switch"
                                />
                            }
                            sx={{
                                ".MuiFormControlLabel-label": {
                                    fontSize: "0.875rem",
                                },
                            }}
                            label={t("A")}
                            labelPlacement="start"
                            position="left"
                        />
                    </FormGroup>
                </Box>
                <DialogActions
                    sx={{
                        paddingRight: 0,
                        paddingBottom: 0,
                        paddingTop: 0,
                        paddingLeft: 0,
                    }}
                >
                    <Button
                        variant="contained"
                        sx={{ marginRight: 0 }}
                        onClick={handleCancelDialog}
                        data-testid="cancel-button"
                    >
                        {t("cancelBtn")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        sx={{ marginRight: 0 }}
                        data-testid="save-button"
                    >
                        {t("saveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default CatalogMeasureDialog;
