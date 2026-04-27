import { Dialog as MaterialDialog } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";

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
                        bgcolor: "#e6e8ec",
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
