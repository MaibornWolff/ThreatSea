/**
 * @module measure.dialog - Defines the dialog
 *     for the measures under risk.
 */

import { Box, DialogActions, DialogTitle } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { DialogTextField } from "../components/dialog.textfield.component";
import { BoxNameTextField } from "#view/components/name-textfield.component.tsx";
import { DescriptionTextField } from "#view/components/description-textfield.component.jsx";
import type { Project } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

interface FormValues {
    id: number | undefined;
    name: string;
    description: string;
    scheduledAt: string | Date | null;
    catalogMeasureId: number | null;
}

interface MeasureFormValues extends FormValues, Omit<Partial<Measure>, keyof FormValues>, DialogValue {}

interface AddMeasureDialogProps extends DialogProps {
    project: Project;
    measure: Partial<Measure> | undefined;
}

/**
 * Creates a dialog for the measures. Out of the Risk Page
 *
 * @param {object} project - The current project data.
 * @param {boolean} measureData - The data of the measure.
 * @param {object} props - Dialog properties.
 * @returns React component for the measure dialog.
 */
const AddMeasureDialog = ({ project, measure, ...props }: AddMeasureDialogProps) => {
    const navigate = useNavigate();
    const { confirmDialog, cancelDialog } = useDialog<MeasureFormValues | null>("measures");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<MeasureFormValues>({
        defaultValues: {
            ...measure,
            id: measure?.id,
            name: measure?.name ?? "",
            description: measure?.description ?? "",
            scheduledAt: measure?.scheduledAt ?? null,
            catalogMeasureId: measure?.catalogMeasureId ?? null,
        },
    });

    const { t } = useTranslation("catalogMeasureDialogPage");

    /**
     * Cancel a dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Lets the user edit a measure on the risk page.
     *
     * @event Box#onSubmit
     * @param {object} data - Data of the measure.
     */
    const handleConfirmDialog = ({ ...data }: MeasureFormValues) => {
        confirmDialog({
            ...data,
            preSelectMeasureImpactDialog: true,
            projectId: project.id,
        });
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
                {t("addMeasure")}
            </DialogTitle>
            <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column" }}
                onSubmit={handleSubmit(handleConfirmDialog)}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <BoxNameTextField
                        register={register}
                        error={errors?.name}
                        ownId={measure?.catalogMeasureId}
                        type="measure"
                        projectId={project?.id}
                        rows={2}
                        multiline
                        data-testid="measure-creation-modal_name-input"
                    />

                    <DescriptionTextField
                        register={register}
                        error={errors?.description}
                        data-testid="measure-creation-modal_description-input"
                    />

                    <DialogTextField
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            },
                        }}
                        label={t("scheduledAt")}
                        type="date"
                        {...register("scheduledAt", {
                            required: t("errorMessages.dateRequired"),
                        })}
                        margin="normal"
                        error={!!errors?.scheduledAt}
                        helperText={errors?.scheduledAt?.message}
                        data-testid="measure-creation-modal_scheduled-at-input"
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

export default AddMeasureDialog;
