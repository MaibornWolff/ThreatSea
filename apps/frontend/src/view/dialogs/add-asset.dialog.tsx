/**
 * @module add-asset.dialog - Defines the dialog
 *     for adding an asset.
 */

import {
    Box,
    Collapse,
    DialogActions,
    DialogTitle,
    InputAdornment,
    InputBase,
    Tooltip,
    Typography,
} from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { ExpandLessRounded, ExpandMoreRounded, InfoOutlined } from "@mui/icons-material";
import { useForm, type SubmitErrorHandler } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { DialogTextField } from "../components/dialog.textfield.component";
import { NameTextField } from "../components/name-textfield.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import type { Asset } from "#api/types/asset.types.ts";
import { useState } from "react";
import { IconButton } from "#view/components/icon-button.component.tsx";
import { MIN_CIA_VALUE, MAX_CIA_VALUE } from "./validation-constants";
import { DescriptionTextField } from "#view/components/description-textfield.component.jsx";
import { BigTextField } from "#view/components/big-textfield.component.tsx";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

type JustificationField = "confidentiality" | "integrity" | "availability";

interface FormValues {
    id: number | undefined;
    name: string;
    description: string;
    confidentiality: number | "";
    confidentialityJustification: string;
    integrity: number | "";
    integrityJustification: string;
    availability: number | "";
    availabilityJustification: string;
    projectId: number | undefined;
}

interface AssetDialogFormValues extends FormValues, Omit<Partial<Asset>, keyof FormValues>, DialogValue {}

interface AddAssetDialogProps extends DialogProps {
    projectId: number | undefined;
    asset?: Partial<Asset>;
    userRole: USER_ROLES | undefined;
}

/**
 * Creates a dialog to add new assets.
 *
 * @param {string} projectId - id of the project.
 * @param {object} asset - The asset data.
 * @param {string} userRole - The current user's role.
 * @param {object} props - Dialog properties.
 * @returns React component for adding an asset.
 */
const AddAssetDialog = ({ projectId, asset, userRole, ...props }: AddAssetDialogProps) => {
    const { cancelDialog, confirmDialog } = useDialog<AssetDialogFormValues | null>("assets");
    const navigate = useNavigate();
    const { t } = useTranslation("assetDialogPage");
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AssetDialogFormValues>({
        defaultValues: {
            ...asset,
            id: asset?.id ?? undefined,
            name: asset?.name ?? "",
            description: asset?.description ?? "",
            confidentiality: asset?.confidentiality ?? "",
            confidentialityJustification: asset?.confidentialityJustification ?? "",
            integrity: asset?.integrity ?? "",
            integrityJustification: asset?.integrityJustification ?? "",
            availability: asset?.availability ?? "",
            availabilityJustification: asset?.availabilityJustification ?? "",
            projectId: asset?.projectId ?? projectId,
        },
    });
    const [justificationDropDown, setJustificationDropDown] = useState<JustificationField | null>(null);

    const handleJustificationDropDownChange = (field: JustificationField) => {
        setJustificationDropDown((prevDropDown) => (prevDropDown === field ? null : field));
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    /**
     * Cancels and closes the dialog.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Opens the Collaps in which the error occured.
     * @param {object} errors
     */
    const handleJustificationErrors: SubmitErrorHandler<AssetDialogFormValues> = (errors) => {
        if (errors.confidentialityJustification) {
            setJustificationDropDown("confidentiality");
            return;
        }
        if (errors.integrityJustification) {
            setJustificationDropDown("integrity");
            return;
        }
        if (errors.availabilityJustification) {
            setJustificationDropDown("availability");
            return;
        }
    };

    /**
     * Confirms the dialog and uses the filled data.
     * @event Button#onSubmit
     * @param {object} data
     */
    const handleConfirmDialog = (data: AssetDialogFormValues) => {
        confirmDialog(data);
        closeDialog();
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
                {asset ? t("editAsset") : t("addAsset")}
            </DialogTitle>

            <Box
                component="form"
                onSubmit={handleSubmit(handleConfirmDialog, handleJustificationErrors)}
                sx={{ display: "flex", flexDirection: "column" }}
            >
                {asset && (
                    <Typography
                        style={{
                            fontSize: "small",
                            fontStyle: "italic",
                            textAlign: "right",
                        }}
                    >
                        ID: {asset.id}
                    </Typography>
                )}
                <NameTextField
                    register={register}
                    error={errors?.name}
                    projectId={projectId}
                    ownId={asset?.id}
                    type="asset"
                    data-testid="asset-creation-modal_name-input"
                />

                <DescriptionTextField
                    register={register}
                    error={errors?.description}
                    data-testid="asset-creation-modal_description-input"
                />

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        marginTop: 0.5,
                    }}
                >
                    <Box>
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
                            label={t("confidentiality")}
                            min={MIN_CIA_VALUE}
                            max={MIN_CIA_VALUE}
                            margin="normal"
                            {...register("confidentiality", {
                                required: t("errorMessages.confidentialityValue"),
                                valueAsNumber: true,
                                min: {
                                    value: MIN_CIA_VALUE,
                                    message: t("errorMessages.confidentialityMin"),
                                },
                                max: {
                                    value: MAX_CIA_VALUE,
                                    message: t("errorMessages.confidentialityMax"),
                                },
                            })}
                            error={!!errors?.confidentiality}
                            helperText={errors?.confidentiality?.message}
                            data-testid="asset-creation-modal_confidentiality-input"
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
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <IconButton
                                sx={{ padding: 0 }}
                                onClick={() => handleJustificationDropDownChange("confidentiality")}
                                title={justificationDropDown === null ? t("justification") : undefined}
                                data-testid="asset-creation-modal_confidentiality-justification-button"
                            >
                                {justificationDropDown === "confidentiality" ? (
                                    <ExpandLessRounded />
                                ) : (
                                    <ExpandMoreRounded />
                                )}
                            </IconButton>
                        </Box>
                    </Box>
                    <Box>
                        <DialogTextField
                            type="number"
                            label={t("integrity")}
                            margin="normal"
                            min={1}
                            max={5}
                            sx={{
                                marginLeft: 1,
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
                            {...register("integrity", {
                                required: t("errorMessages.integrityValue"),
                                valueAsNumber: true,
                                min: {
                                    value: 1,
                                    message: t("errorMessages.integrityMin"),
                                },
                                max: {
                                    value: 5,
                                    message: t("errorMessages.integrityMax"),
                                },
                            })}
                            error={!!errors?.integrity}
                            helperText={errors?.integrity?.message}
                            data-testid="asset-creation-modal_integrity-input"
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
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <IconButton
                                sx={{ padding: 0 }}
                                onClick={() => handleJustificationDropDownChange("integrity")}
                                title={justificationDropDown === null ? t("justification") : undefined}
                                data-testid="asset-creation-modal_integrity-justification-button"
                            >
                                {justificationDropDown === "integrity" ? <ExpandLessRounded /> : <ExpandMoreRounded />}
                            </IconButton>
                        </Box>
                    </Box>
                    <Box>
                        <DialogTextField
                            type="number"
                            label={t("availability")}
                            margin="normal"
                            min={1}
                            max={5}
                            sx={{
                                marginLeft: 1,
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
                            {...register("availability", {
                                required: t("errorMessages.availabilityValue"),
                                valueAsNumber: true,
                                min: {
                                    value: 1,
                                    message: t("errorMessages.availabilityMin"),
                                },
                                max: {
                                    value: 5,
                                    message: t("errorMessages.availabilityMax"),
                                },
                            })}
                            error={!!errors?.availability}
                            helperText={errors?.availability?.message}
                            data-testid="asset-creation-modal_availability-input"
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
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <IconButton
                                sx={{ padding: 0 }}
                                onClick={() => handleJustificationDropDownChange("availability")}
                                title={justificationDropDown === null ? t("justification") : undefined}
                                data-testid="asset-creation-modal_availability-justification-button"
                            >
                                {justificationDropDown === "availability" ? (
                                    <ExpandLessRounded />
                                ) : (
                                    <ExpandMoreRounded />
                                )}
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
                <Box>
                    <Collapse in={justificationDropDown === "confidentiality"} timeout={0}>
                        <BigTextField
                            register={register}
                            fieldName={"confidentialityJustification"}
                            error={errors?.confidentialityJustification}
                            label={t("confidentialityJustification")}
                            rows={2}
                            fullWidth
                            data-testid="asset-creation-modal_confidentiality-justification-input"
                        />
                    </Collapse>

                    <Collapse in={justificationDropDown === "integrity"} timeout={0}>
                        <BigTextField
                            register={register}
                            fieldName={"integrityJustification"}
                            error={errors?.integrityJustification}
                            label={t("integrityJustification")}
                            rows={2}
                            fullWidth
                            data-testid="asset-creation-modal_integrity-justification-input"
                        />
                    </Collapse>

                    <Collapse in={justificationDropDown === "availability"} timeout={0}>
                        <BigTextField
                            register={register}
                            fieldName={"availabilityJustification"}
                            error={errors?.availabilityJustification}
                            label={t("availabilityJustification")}
                            rows={2}
                            fullWidth
                            data-testid="asset-creation-modal_availability-justification-input"
                        />
                    </Collapse>
                </Box>

                <InputBase type="hidden" value={projectId ?? ""} {...register("projectId")} />
                <DialogActions
                    sx={{
                        paddingRight: 0,
                        paddingBottom: 0,
                        paddingTop: 1.5,
                        paddingLeft: 0,
                    }}
                >
                    <Button onClick={handleCancelDialog} sx={{ marginRight: 0 }} data-testid="cancel-button">
                        {t("cancelBtn")}
                    </Button>
                    <Button
                        type="submit"
                        color="success"
                        sx={{ marginRight: 0 }}
                        data-testid="save-button"
                        disabled={!checkUserRole(userRole, USER_ROLES.EDITOR)}
                    >
                        {t("saveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default AddAssetDialog;
