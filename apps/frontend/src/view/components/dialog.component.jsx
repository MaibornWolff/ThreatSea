import { Dialog as MaterialDialog } from "@mui/material";

export const Dialog = ({ open, onBackdropClick, children, ...props }) => {
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
