/**
 * @module folder.dialog - Defines the dialog for creating and renaming a folder.
 */
import { Box, DialogActions, DialogTitle } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDialog } from "#application/hooks/use-dialog.hook.ts";
import { Button } from "#view/components/button.component.tsx";
import { Dialog } from "#view/components/dialog.component.tsx";
import { NameTextField } from "#view/components/name-textfield.component.tsx";
import type { Folder } from "#api/types/folder.types.ts";
import type { DialogValue } from "#application/reducers/dialogs.reducer.ts";

interface FolderFormValues extends DialogValue {
    id: number | undefined;
    name: string;
    parentId: number | null;
}

interface FolderDialogProps extends DialogProps {
    // When present the dialog renames this folder; otherwise it creates a new one under `parentId`.
    folder: Folder | undefined;
    parentId: number | null;
}

/**
 * Creates a dialog to add or rename a folder. Whether it creates or updates is driven by the
 * presence of `id` in the submitted values (handled in the dialogs middleware).
 */
const FolderDialog = ({ folder, parentId, ...props }: FolderDialogProps) => {
    const { cancelDialog, confirmDialog } = useDialog<FolderFormValues | null>("folders");
    const { t } = useTranslation("projectsPage");
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FolderFormValues>({
        defaultValues: {
            name: folder?.name ?? "",
        },
    });
    const navigate = useNavigate();

    const closeDialog = () => {
        navigate(-1);
    };

    const handleCancelDialog = () => {
        cancelDialog();
        closeDialog();
    };

    const handleConfirmDialog = (data: FolderFormValues) => {
        // `id` and `parentId` are merged from props rather than form state: only `name` is a
        // registered input, and unregistered default values must not be relied on to survive.
        confirmDialog({
            ...data,
            id: folder?.id,
            parentId: folder ? folder.parentId : parentId,
        });
        closeDialog();
    };

    return (
        <Dialog
            onClose={(_event, reason) => {
                if (reason === "backdropClick") {
                    handleCancelDialog();
                }
            }}
            maxWidth="xs"
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
                {folder ? t("folders.editFolderTitle") : t("folders.addFolderTitle")}
            </DialogTitle>

            <Box
                component="form"
                onSubmit={handleSubmit(handleConfirmDialog)}
                sx={{ display: "flex", flexDirection: "column" }}
            >
                <NameTextField register={register} error={errors?.name} data-testid="folder-modal_name-input" />

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

export default FolderDialog;
