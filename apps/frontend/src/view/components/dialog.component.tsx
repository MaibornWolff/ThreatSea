import { Dialog as MaterialDialog } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";
import { colors } from "#view/wrappers/tokens.ts";

export const Dialog = ({ open, onClose, children, ...props }: DialogProps) => {
    return (
        <MaterialDialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        bgcolor: colors.surface.dialog,
                        borderRadius: 5,
                        padding: "30px",
                    },
                },
            }}
            {...props}
        >
            {children}
        </MaterialDialog>
    );
};
