import { DialogActions, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Button } from "#view/components/button.component.tsx";
import { Dialog } from "#view/components/dialog.component.tsx";

export interface UnsavedLineOfToleranceDialogProps {
    open: boolean;
    isSaving: boolean;
    onStay: () => void;
    onDiscard: () => void;
    onSave: () => void;
}

/**
 * Asks what to do with unsaved line of tolerance changes before leaving the risk page.
 */
export const UnsavedLineOfToleranceDialog = ({
    open,
    isSaving,
    onStay,
    onDiscard,
    onSave,
}: UnsavedLineOfToleranceDialogProps) => {
    const { t } = useTranslation("common");

    return (
        <Dialog
            open={open}
            maxWidth={"xs"}
            fullWidth={false}
            onClose={(_event, reason) => {
                if (reason === "backdropClick" && !isSaving) {
                    onStay();
                }
            }}
        >
            <Box>
                <Typography>{t("lineOfTolerance.unsavedMessage")}</Typography>
                <DialogActions sx={{ padding: 0, marginTop: 2 }}>
                    <Button sx={{ marginRight: 0 }} onClick={onStay} disabled={isSaving}>
                        {t("lineOfTolerance.stayBtn")}
                    </Button>
                    <Button sx={{ marginRight: 0 }} color="error" onClick={onDiscard} disabled={isSaving}>
                        {t("lineOfTolerance.discardAndLeaveBtn")}
                    </Button>
                    <Button sx={{ marginRight: 0 }} onClick={onSave} disabled={isSaving}>
                        {t("lineOfTolerance.saveAndLeaveBtn")}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};
