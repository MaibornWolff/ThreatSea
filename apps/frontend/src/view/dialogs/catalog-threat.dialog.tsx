/**
 * @module catalog-threat.dialog - Defines the dialog
 *     for the catalogue threats.
 */

import {
    Box,
    DialogActions,
    DialogTitle,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
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
import type { CatalogThreat } from "#api/types/catalog-threat.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

type CatalogThreatAttacker = ATTACKERS | ATTACKERS[] | null;
type CatalogThreatPointOfAttack = POINTS_OF_ATTACK | POINTS_OF_ATTACK[] | null;

interface FormValues {
    id: number | undefined;
    name: string;
    description: string;
    attacker: CatalogThreatAttacker;
    pointOfAttack: CatalogThreatPointOfAttack;
    probability: number | "";
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
}

interface CatalogThreatFormValues extends FormValues, Omit<Partial<CatalogThreat>, keyof FormValues>, DialogValue {}

interface CatalogThreatDialogProps extends DialogProps {
    catalogThreat: Partial<CatalogThreat> | undefined;
    isNew: boolean;
}

/**
 * Creates a dialog for adding/editing catalogue threats.
 *
 * @param {object} catalogThreat - The threat data.
 * @param {boolean} isNew - Indicator if the threat is a new one to be added.
 * @param {object} props - Dialog properties.
 * @returns React component for the catalogue threats dialog.
 */
const CatalogThreatDialog = ({ catalogThreat, isNew, ...props }: CatalogThreatDialogProps) => {
    const navigate = useNavigate();
    const { confirmDialog, cancelDialog } = useDialog<CatalogThreatFormValues | null>("catalogThreats");
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CatalogThreatFormValues>({
        defaultValues: {
            ...catalogThreat,
            id: catalogThreat?.id,
            name: catalogThreat?.name ?? "",
            description: catalogThreat?.description ?? "",
            attacker: catalogThreat?.attacker ?? null,
            pointOfAttack: catalogThreat?.pointOfAttack ?? null,
            probability: catalogThreat?.probability ?? "",
            confidentiality: catalogThreat?.confidentiality ?? false,
            integrity: catalogThreat?.integrity ?? false,
            availability: catalogThreat?.availability ?? false,
        },
    });
    const { t } = useTranslation("catalogPage");

    /**
     * Cancel a dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Adds or changes a catalogue threat.
     *
     * @event Box#onSubmit
     * @param {object} catalogThreat - Data of the catalogue threat
     *     from the dialog.
     */
    const handleConfirmDialog = (catalogThreat: CatalogThreatFormValues) => {
        const { probability, ...data } = catalogThreat;

        if (isNew) {
            const { attacker, pointOfAttack, ...rest } = data;
            const attackerList = attacker as ATTACKERS[];
            const pointOfAttackList = pointOfAttack as POINTS_OF_ATTACK[];
            attackerList.forEach((attackerItem) => {
                pointOfAttackList.forEach((pointOfAttackItem) => {
                    confirmDialog({
                        ...rest,
                        attacker: attackerItem,
                        pointOfAttack: pointOfAttackItem,
                        probability: parseInt(String(probability), 10),
                    });
                });
            });
        } else {
            confirmDialog({
                ...data,
                probability: parseInt(String(probability), 10),
            });
        }

        closeDialog();
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    return (
        <Dialog onBackdropClick={handleCancelDialog} maxWidth="sm" fullWidth {...props} open={true}>
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {isNew ? t("addThreat") : t("editThreat")}
            </DialogTitle>
            <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column" }}
                onSubmit={handleSubmit(handleConfirmDialog)}
            >
                <NameTextField
                    register={register}
                    error={errors?.name}
                    data-testid="catalog-threat-creation-modal_name-input"
                />

                <DescriptionTextField
                    register={register}
                    error={errors?.description}
                    data-testid="catalog-threat-creation-modal_description-input"
                />

                <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1 }}>
                    <FormControl
                        fullWidth
                        sx={{
                            mr: 1,
                            "&:hover fieldset": {
                                borderColor: "#fcac0c !important",
                            },
                        }}
                        error={!!errors?.attacker}
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
                                        validate: (value) => !!value && value.length > 0,
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
                                    data-testid="catalog-threat-creation-modal_attacker-selection"
                                >
                                    <MenuItem
                                        value={ATTACKERS.UNAUTHORISED_PARTIES}
                                        data-testid="catalog-threat-creation-modal_attacker-selection_un-par"
                                    >
                                        {t("attackerList.UNAUTHORISED_PARTIES")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.SYSTEM_USERS}
                                        data-testid="catalog-threat-creation-modal_attacker-selection_sys-us"
                                    >
                                        {t("attackerList.SYSTEM_USERS")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.APPLICATION_USERS}
                                        data-testid="catalog-threat-creation-modal_attacker-selection_app-us"
                                    >
                                        {t("attackerList.APPLICATION_USERS")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.ADMINISTRATORS}
                                        data-testid="catalog-threat-creation-modal_attacker-selection_adm-us"
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
                        error={!!errors?.pointOfAttack}
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
                                        validate: (value) => !!value && value.length > 0,
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
                                    data-testid="catalog-threat-creation-modal_poa-selection"
                                >
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE}
                                        data-testid="catalog-threat-creation-modal_PoA-selection_da-sto-infra"
                                    >
                                        {t("pointsOfAttackList.DATA_STORAGE_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE}
                                        data-testid="catalog-threat-creation-modal_PoA-selection_pro-infra"
                                    >
                                        {t("pointsOfAttackList.PROCESSING_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE}
                                        data-testid="catalog-threat-creation-modal_PoA-selection_com-infra"
                                    >
                                        {t("pointsOfAttackList.COMMUNICATION_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.COMMUNICATION_INTERFACES}
                                        data-testid="catalog-threat-creation-modal_PoA-selection_com-inter"
                                    >
                                        {t("pointsOfAttackList.COMMUNICATION_INTERFACES")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.USER_INTERFACE}
                                        data-testid="catalog-threat-creation-modal_PoA-selection_us-inter"
                                    >
                                        {t("pointsOfAttackList.USER_INTERFACE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.USER_BEHAVIOUR}
                                        data-testid="catalog-threat-creation-modal_PoA-selection_us-beh"
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
                    data-testid="catalog-threat-creation-modal_probability-input"
                />
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Controller
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            {...field}
                                            checked={!!field?.value}
                                            data-testid="catalog-threat-creation-modal_confidentiality-switch"
                                        />
                                    )}
                                    {...register("confidentiality", {
                                        value: false,
                                    })}
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
                                    render={({ field }) => (
                                        <Switch
                                            {...field}
                                            checked={!!field?.value}
                                            data-testid="catalog-threat-creation-modal_integrity-switch"
                                        />
                                    )}
                                    {...register("integrity", {
                                        value: false,
                                    })}
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
                                    render={({ field }) => (
                                        <Switch
                                            {...field}
                                            checked={!!field?.value}
                                            data-testid="catalog-threat-creation-modal_availability-switch"
                                        />
                                    )}
                                    {...register("availability", {
                                        value: false,
                                    })}
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
                        onClick={handleCancelDialog}
                        sx={{ marginRight: 0 }}
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

export default CatalogThreatDialog;
