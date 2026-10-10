/**
 * @module catalog-item.dialog - Defines the dialog
 *     for catalogue threats and measures.
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
import { useTheme } from "@mui/material/styles";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ATTACKERS } from "#api/types/attackers.types.ts";
import { POINTS_OF_ATTACK } from "#api/types/points-of-attack.types.ts";
import { useDialog } from "#application/hooks/use-dialog.hook.ts";
import { Button } from "#view/components/button.component.tsx";
import { Dialog } from "#view/components/dialog.component.tsx";
import { DialogTextField } from "#view/components/dialog.textfield.component.tsx";
import { NameTextField } from "#view/components/name-textfield.component.tsx";
import { DescriptionTextField } from "#view/components/description-textfield.component.tsx";
import type { CatalogItem, CatalogItemType } from "#api/types/catalog-item.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

type CatalogItemAttacker = ATTACKERS | ATTACKERS[] | null;
type CatalogItemPointOfAttack = POINTS_OF_ATTACK | POINTS_OF_ATTACK[] | null;

interface FormValues {
    id: number | undefined;
    name: string;
    description: string;
    attacker: CatalogItemAttacker;
    pointOfAttack: CatalogItemPointOfAttack;
    probability: number | "";
    confidentiality: boolean;
    integrity: boolean;
    availability: boolean;
}

interface CatalogItemFormValues extends FormValues, Omit<Partial<CatalogItem>, keyof FormValues>, DialogValue {}

// Per-type differences, kept exactly as the former separate dialogs had them.
const TYPE_CONFIG = {
    threat: {
        dialogNameSpace: "catalogThreats",
        addTitleKey: "addThreat",
        editTitleKey: "editThreat",
        probabilityErrorNamespace: "",
        hasNameCheckProps: false,
        attackerTestId: undefined,
    },
    measure: {
        dialogNameSpace: "catalogMeasures",
        addTitleKey: "addMeasure",
        editTitleKey: "editMeasure",
        probabilityErrorNamespace: "catalogMeasureDialogPage:",
        hasNameCheckProps: true,
        attackerTestId: "AttackerError",
    },
} as const satisfies Record<CatalogItemType, unknown>;

interface CatalogItemDialogProps extends DialogProps {
    type: CatalogItemType;
    item: Partial<CatalogItem> | undefined;
    isNew: boolean;
    catalogId?: number;
}

/**
 * Creates a dialog for adding/editing catalogue threats and measures.
 *
 * @param {string} type - Whether the item is a threat or a measure.
 * @param {object} item - The threat or measure data.
 * @param {boolean} isNew - Indicator if the item is a new one to be added.
 * @param {object} props - Dialog properties.
 * @returns React component for the catalogue item dialog.
 */
const CatalogItemDialog = ({ type, item, isNew, catalogId, ...props }: CatalogItemDialogProps) => {
    const { dialogNameSpace, addTitleKey, editTitleKey, probabilityErrorNamespace, hasNameCheckProps, attackerTestId } =
        TYPE_CONFIG[type];
    const testIdPrefix = `catalog-${type}-creation-modal_`;
    const navigate = useNavigate();
    const { confirmDialog, cancelDialog } = useDialog<CatalogItemFormValues | null>(dialogNameSpace);
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<CatalogItemFormValues>({
        defaultValues: {
            ...item,
            id: item?.id,
            name: item?.name ?? "",
            description: item?.description ?? "",
            attacker: item?.attacker ?? null,
            pointOfAttack: item?.pointOfAttack ?? null,
            probability: item?.probability ?? "",
            confidentiality: item?.confidentiality ?? false,
            integrity: item?.integrity ?? false,
            availability: item?.availability ?? false,
        },
    });
    const { t } = useTranslation("catalogPage");
    const theme = useTheme();

    /**
     * Cancel a dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Adds or changes a catalogue item.
     *
     * @event Box#onSubmit
     * @param {object} formValues - Data of the catalogue item
     *     from the dialog.
     */
    const handleConfirmDialog = (formValues: CatalogItemFormValues) => {
        const { probability, ...data } = formValues;

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
        <Dialog
            onClose={(_event, reason) => {
                if (reason === "backdropClick") {
                    handleCancelDialog?.();
                }
            }}
            maxWidth="sm"
            fullWidth
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
                {isNew ? t(addTitleKey) : t(editTitleKey)}
            </DialogTitle>
            <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column" }}
                onSubmit={handleSubmit(handleConfirmDialog)}
            >
                <NameTextField
                    register={register}
                    error={errors?.name}
                    {...(hasNameCheckProps && { ownId: item?.id, type, catalogId })}
                    data-testid={`${testIdPrefix}name-input`}
                />

                <DescriptionTextField
                    register={register}
                    error={errors?.description}
                    data-testid={`${testIdPrefix}description-input`}
                />

                <Box sx={{ display: "flex", alignItems: "center", mt: 2, mb: 1 }}>
                    <FormControl
                        fullWidth
                        sx={{
                            mr: 1,
                        }}
                        error={!!errors?.attacker}
                        data-testid={attackerTestId}
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
                                        slotProps: {
                                            paper: {
                                                sx: {
                                                    bgcolor: "background.mainIntransparent",
                                                    borderRadius: 5,
                                                    "*": {
                                                        fontSize: "0.875rem !important",
                                                    },
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
                                            borderColor: `${theme.vars.palette.secondary.main} !important`,
                                        },
                                    }}
                                    data-testid={`${testIdPrefix}attacker-selection`}
                                >
                                    <MenuItem
                                        value={ATTACKERS.UNAUTHORISED_PARTIES}
                                        data-testid={`${testIdPrefix}attacker-selection_un-par`}
                                    >
                                        {t("attackerList.UNAUTHORISED_PARTIES")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.SYSTEM_USERS}
                                        data-testid={`${testIdPrefix}attacker-selection_sys-us`}
                                    >
                                        {t("attackerList.SYSTEM_USERS")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.APPLICATION_USERS}
                                        data-testid={`${testIdPrefix}attacker-selection_app-us`}
                                    >
                                        {t("attackerList.APPLICATION_USERS")}
                                    </MenuItem>
                                    <MenuItem
                                        value={ATTACKERS.ADMINISTRATORS}
                                        data-testid={`${testIdPrefix}attacker-selection_adm-us`}
                                    >
                                        {t("attackerList.ADMINISTRATORS")}
                                    </MenuItem>
                                </Select>
                            )}
                        />
                        <FormHelperText>{errors?.attacker?.message}</FormHelperText>
                    </FormControl>

                    <FormControl fullWidth error={!!errors?.pointOfAttack} data-testid="PoAError">
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
                                        slotProps: {
                                            paper: {
                                                sx: {
                                                    bgcolor: "background.mainIntransparent",
                                                    borderRadius: 5,
                                                    "*": {
                                                        fontSize: "0.875rem !important",
                                                    },
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
                                            borderColor: `${theme.vars.palette.secondary.main} !important`,
                                        },
                                    }}
                                    data-testid={`${testIdPrefix}poa-selection`}
                                >
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.DATA_STORAGE_INFRASTRUCTURE}
                                        data-testid={`${testIdPrefix}PoA-selection_da-sto-infra`}
                                    >
                                        {t("pointsOfAttackList.DATA_STORAGE_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.PROCESSING_INFRASTRUCTURE}
                                        data-testid={`${testIdPrefix}PoA-selection_pro-infra`}
                                    >
                                        {t("pointsOfAttackList.PROCESSING_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.COMMUNICATION_INFRASTRUCTURE}
                                        data-testid={`${testIdPrefix}PoA-selection_com-infra`}
                                    >
                                        {t("pointsOfAttackList.COMMUNICATION_INFRASTRUCTURE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.COMMUNICATION_INTERFACES}
                                        data-testid={`${testIdPrefix}PoA-selection_com-inter`}
                                    >
                                        {t("pointsOfAttackList.COMMUNICATION_INTERFACES")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.USER_INTERFACE}
                                        data-testid={`${testIdPrefix}PoA-selection_us-inter`}
                                    >
                                        {t("pointsOfAttackList.USER_INTERFACE")}
                                    </MenuItem>
                                    <MenuItem
                                        value={POINTS_OF_ATTACK.USER_BEHAVIOUR}
                                        data-testid={`${testIdPrefix}PoA-selection_us-beh`}
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
                        required: t(`${probabilityErrorNamespace}errorMessages.probabilityRequired`),
                        valueAsNumber: true,
                        min: {
                            value: 1,
                            message: t(`${probabilityErrorNamespace}errorMessages.probabilityMin`),
                        },
                        max: {
                            value: 5,
                            message: t(`${probabilityErrorNamespace}errorMessages.probabilityMax`),
                        },
                    })}
                    error={!!errors?.probability}
                    helperText={errors?.probability?.message}
                    data-testid={`${testIdPrefix}probability-input`}
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
                                            data-testid={`${testIdPrefix}confidentiality-switch`}
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
                                            data-testid={`${testIdPrefix}integrity-switch`}
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
                                            data-testid={`${testIdPrefix}availability-switch`}
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

export default CatalogItemDialog;
