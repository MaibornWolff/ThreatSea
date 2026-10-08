import { dialogClasses } from "@mui/material";
import { Outlet, useNavigate } from "react-router";
// The shared Dialog, not MUI's: it carries the paper styling.
import { Dialog } from "#view/components/dialog.component.tsx";

/**
 * One persistent dialog for the chain dialogs. Swapping from one chain dialog to the next only
 * changes the outlet, so the modal stays mounted and the backdrop doesn't fade in again.
 *
 * @component
 * @category Components
 */
export const ChainDialogShell = () => {
    const navigate = useNavigate();
    return (
        <Dialog
            open={true}
            onClose={(_event, reason) => {
                if (reason === "backdropClick") {
                    navigate(-1);
                }
            }}
            maxWidth={false}
            fullWidth={false}
            sx={{
                // Top-anchored, so a swap to a shorter dialog doesn't jump vertically.
                [`& .${dialogClasses.container}`]: { alignItems: "flex-start" },
                [`& .${dialogClasses.paper}`]: { marginTop: 8, maxHeight: "calc(100% - 96px)", padding: 0 },
            }}
        >
            <Outlet />
        </Dialog>
    );
};
