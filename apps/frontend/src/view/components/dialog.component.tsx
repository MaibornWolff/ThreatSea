import { Dialog as MaterialDialog } from "@mui/material";
import type { DialogProps } from "@mui/material/Dialog";

export const Dialog = ({ open, onBackdropClick, children, ...props }: DialogProps) => {
    return (
        <MaterialDialog
            open={open}
            onBackdropClick={onBackdropClick}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    bgcolor: "#e6e8ec",
                    borderRadius: 5,
                    padding: "30px",
                },
            }}
            {...props}
        >
            {children}
        </MaterialDialog>
    );
};
