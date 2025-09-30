/**
 * @module add-project.dialog - Defines the dialog
 *     for adding a new project.
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
    Typography,
} from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useCatalogs } from "../../application/hooks/use-catalogs.hook";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { NameTextField } from "../components/name-textfield.component";
import { CONFIDENTIALITY_LEVELS } from "../../utils/confidentiality";
import { DescriptionTextField } from "#view/components/description-textfield.component.jsx";

/**
 * Creates a dialog to add new projects.
 *
 * @param {object} project - The project data.
 * @param {object} props - Dialog properties.
 * @returns React component for adding a project.
 */
const AddProjectDialog = ({ project, ...props }) => {
    const { cancelDialog, confirmDialog } = useDialog("projects");
    const { items: catalogs, loadCatalogs } = useCatalogs();
    const { t } = useTranslation("projectDialogPage");
    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues: {
            ...project,
            id: project?.id ?? undefined,
            name: project?.name ?? "",
            description: project?.description ?? "",
            catalogId: project?.catalogId ?? "",
            confidentialityLevel: project?.confidentialityLevel ?? CONFIDENTIALITY_LEVELS.INTERNAL,
        },
    });
    const navigate = useNavigate();

    /**
     * Cancels the dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Confirmes the dialog and adds a new project.
     * @event Button#onSubmit
     * @param {object} data - Data of the project.
     */
    const handleConfirmDialog = (data) => {
        confirmDialog(data);
        closeDialog();
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    /**
     * Loads all catalogs for chosing.
     */
    useEffect(loadCatalogs, [loadCatalogs]);

    return (
        <Dialog open={true} onBackdropClick={handleCancelDialog} maxWidth="xs" fullWidth {...props}>
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {project ? t("editProject") : t("addProject")}
            </DialogTitle>

            <Box
                component="form"
                onSubmit={handleSubmit(handleConfirmDialog)}
                sx={{ display: "flex", flexDirection: "column" }}
            >
                <NameTextField
                    register={register}
                    error={errors?.name}
                    data-testid="project-creation-modal_name-input"
                />

                <DescriptionTextField
                    register={register}
                    error={errors?.description}
                    data-testid="project-creation-modal_description-input"
                />

                <FormControl
                    fullWidth
                    margin="normal"
                    error={errors?.catalogId}
                    sx={{
                        "&:hover fieldset": {
                            borderColor: "#fcac0c !important",
                        },
                    }}
                >
                    <InputLabel
                        id="select-catalog-label"
                        shrink
                        sx={{
                            marginLeft: 1,
                            fontSize: "1rem",
                        }}
                    >
                        {t("catalog")}
                    </InputLabel>
                    <Controller
                        name="catalogId"
                        control={control}
                        rules={{
                            required: t("projectDialogPage:errorMessages.catalogRequired"),
                        }}
                        render={({ field }) => (
                            <Select
                                labelId="select-catalog-label"
                                data-testid="project-creation-modal_catalog-selection"
                                id="select-catalog"
                                label={t("catalog")}
                                {...field}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            bgcolor: "background.mainIntransparent",
                                            borderRadius: 5,
                                            "*": {
                                                fontSize: "0.875rem !important",
                                            },
                                            sub: {
                                                fontSize: "0.75em !important",
                                                verticalAlign: "sub",
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
                                        "& sub": {
                                            fontSize: "0.75em",
                                            verticalAlign: "sub",
                                        },
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
                                {catalogs.map((catalog, i) => {
                                    const { id, name, language } = catalog;
                                    return (
                                        <MenuItem key={i} value={id}>
                                            {name}
                                            <Typography
                                                sx={{ textTransform: "uppercase", marginLeft: "0.25rem" }}
                                                variant="span"
                                            >
                                                <sub>{language}</sub>
                                            </Typography>
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        )}
                    />
                    <FormHelperText>{errors?.catalogId?.message}</FormHelperText>
                </FormControl>
                <FormControl
                    fullWidth
                    margin="normal"
                    sx={{
                        "&:hover fieldset": {
                            borderColor: "#fcac0c !important",
                        },
                    }}
                >
                    <InputLabel
                        id="select-catalog-label"
                        shrink
                        sx={{
                            marginLeft: 1,
                            fontSize: "1rem",
                        }}
                    >
                        {t("confidentiality")}
                    </InputLabel>
                    <Controller
                        name="confidentialityLevel"
                        control={control}
                        defaultValue={CONFIDENTIALITY_LEVELS.INTERNAL}
                        render={({ field }) => (
                            <Select
                                labelId="select-confidentiality-label"
                                data-testid="project-creation-modal_confidentiality-selection"
                                id="select-confidentiality"
                                label={t("confidentiality")}
                                {...field}
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
                                {Object.values(CONFIDENTIALITY_LEVELS).map((confidentiality, i) => {
                                    return (
                                        <MenuItem key={i} value={confidentiality}>
                                            {t("confidentialityLevels." + confidentiality)}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        )}
                    />
                </FormControl>
                <DialogActions
                    sx={{
                        paddingRight: 0,
                        paddingBottom: 0,
                        paddingTop: 1.5,
                        paddingLeft: 0,
                    }}
                >
                    <Button data-testid="cancel-button" sx={{ marginRight: 0 }} onClick={handleCancelDialog}>
                        {t("projectDialogPage:cancelBtn")}
                    </Button>
                    <Button data-testid="save-button" sx={{ marginRight: 0 }} type="submit" color="success">
                        {t("projectDialogPage:saveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default AddProjectDialog;
