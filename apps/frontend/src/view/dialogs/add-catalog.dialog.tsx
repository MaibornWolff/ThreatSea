/**
 * @module add-catalog.dialog - Defines the dialog
 *     for adding a catalogue.
 */

import { Box, Checkbox, DialogActions, DialogTitle, FormControlLabel, Tooltip } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { useState, type MouseEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDialog } from "../../application/hooks/use-dialog.hook";
import { Button } from "../components/button.component";
import { Dialog } from "../components/dialog.component";
import { ToggleButtons } from "../components/toggle-buttons.component";
import { NameTextField } from "../components/name-textfield.component";
import { InfoOutlined } from "@mui/icons-material";
import type { Catalog } from "#api/types/catalogs.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

type CatalogLanguage = "EN" | "DE";

interface FormValues {
    id: number | undefined;
    name: string;
    language: CatalogLanguage | string;
    defaultContent: boolean;
}

interface CatalogFormValues extends FormValues, Omit<Partial<Catalog>, keyof FormValues>, DialogValue {}

interface AddCatalogDialogProps extends DialogProps {
    catalog?: Partial<Catalog>;
}

/**
 * Creates a dialog to add new catalogues.
 *
 * @param {object} catalog - The catalogue data.
 * @param {object} props - Dialog properties.
 * @returns React component for adding a catalogue.
 */
const AddCatalogDialog = ({ catalog, ...props }: AddCatalogDialogProps) => {
    const { confirmDialog, cancelDialog } = useDialog<CatalogFormValues | null>("catalogs");
    const [catalogLanguage, setCatalogLanguage] = useState<CatalogLanguage>("EN");
    const navigate = useNavigate();
    const { t } = useTranslation("catalogsPage");
    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
        setValue,
    } = useForm<CatalogFormValues>({
        defaultValues: {
            ...catalog,
            id: catalog?.id ?? undefined,
            name: catalog?.name ?? "",
            language: catalog?.language ?? catalogLanguage,
            defaultContent: true,
        },
    });

    const [defaultContent, setDefaultContent] = useState(true);

    const isNew = !catalog;

    /**
     * Cancels the dialog and closes it.
     * @event Button#onClick
     */
    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    /**
     * Creates or edits a catalogue.
     * If an id is defined, the catalogue has been edited.
     *
     * @event Button#onSubmit
     * @param {object} data - Data of the catalogue.
     */
    const handleConfirmDialog = (data: CatalogFormValues) => {
        if (data.id) {
            confirmDialog(data);
        } else {
            confirmDialog({ ...data, language: catalogLanguage });
        }
        closeDialog();
    };

    /**
     * Closes the dialog.
     */
    const closeDialog = () => {
        navigate(-1);
    };

    /**
     * Onclick handler for the language when creating a catalogue.
     * @event ToggleButtons#onChange
     * @param {SyntheticBaseEvent} _ Event of the click.
     * @param {string} value - language of the catalogue.
     */
    const handleChangeCatalogLanguage = (_: MouseEvent<HTMLElement>, value: CatalogLanguage | null) => {
        if (value) {
            setCatalogLanguage(value);
        }
    };

    return (
        <Dialog onBackdropClick={handleCancelDialog} maxWidth="xs" fullWidth {...props} open={true}>
            <DialogTitle
                sx={{
                    padding: 0,
                    fontSize: "0.875rem",
                    marginBottom: 1,
                    fontWeight: "bold",
                }}
            >
                {isNew ? t("addCatalog") : t("editCatalog")}
            </DialogTitle>
            <Box
                component="form"
                onSubmit={handleSubmit(handleConfirmDialog)}
                sx={{ display: "flex", flexDirection: "column" }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <NameTextField
                        register={register}
                        error={errors?.name}
                        sx={{
                            marginRight: isNew ? 3 : 0,
                            marginBottom: 1,
                            border: "none !important",
                            "& .MuiInputBase-root": {
                                borderBottom: "1px solid rgba(35, 60, 87, 0) !important",
                            },
                            "*": {
                                border: "none !important",
                                padding: "0 !important",
                                borderRadius: "0 !important",
                                fontWeight: "bold",
                            },
                            "& .MuiInputBase-root.Mui-focused": {
                                borderBottom: "1px solid rgba(35, 60, 87, 1) !important",
                            },
                            input: {
                                fontSize: "0.875rem !important",
                                width: "100% !important",
                                autoComplete: "off",
                            },
                            color: "text.primary !important",
                            padding: "0 !important",
                        }}
                        fullWidth
                        data-testid="catalog-creation-modal_name-input"
                    />

                    {isNew && (
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                            }}
                        >
                            <ToggleButtons
                                onChange={handleChangeCatalogLanguage}
                                value={catalogLanguage}
                                buttons={[
                                    {
                                        text: "EN",
                                        value: "EN",
                                    },
                                    {
                                        text: "DE",
                                        value: "DE",
                                    },
                                ]}
                            />
                        </Box>
                    )}
                </Box>

                {isNew && (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <FormControlLabel
                            label={t("emptyCatalog")}
                            control={
                                <Controller
                                    name={"defaultContent"}
                                    control={control}
                                    render={() => (
                                        <Checkbox
                                            data-testid="catalog-creation-modal_empty-checkbox"
                                            checked={!defaultContent}
                                            onChange={(e) => {
                                                setDefaultContent(!e.target.checked);
                                                setValue("defaultContent", !e.target.checked);
                                            }}
                                        />
                                    )}
                                />
                            }
                            sx={{
                                ".MuiFormControlLabel-label": {
                                    fontSize: "0.875rem",
                                },
                                marginRight: 0.75,
                            }}
                        />
                        <Tooltip title={t("emptyExplanation")} sx={{ display: "flex", alignItems: "center" }}>
                            <InfoOutlined
                                sx={{
                                    scale: "0.75",
                                    "&:hover": {
                                        color: "#fcac0c !important",
                                    },
                                }}
                            />
                        </Tooltip>
                    </Box>
                )}

                <DialogActions
                    sx={{
                        paddingRight: 0,
                        paddingBottom: 0,
                        paddingTop: 3.5,
                        paddingLeft: 0,
                    }}
                >
                    <Button data-testid="cancel-button" sx={{ marginRight: 0 }} onClick={handleCancelDialog}>
                        {t("cancelBtn")}
                    </Button>
                    <Button data-testid="save-button" sx={{ marginRight: 0 }} type="submit" color="success">
                        {t("saveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default AddCatalogDialog;
