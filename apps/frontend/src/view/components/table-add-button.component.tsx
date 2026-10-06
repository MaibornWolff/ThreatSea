import Add from "@mui/icons-material/Add";
import { Button } from "@mui/material";

interface TableAddButtonProps {
    label: string;
    onClick: () => void;
    "data-testid"?: string;
}

/**
 * The add action of a table page's toolbar: a filled button that comes first, so it is clearly the
 * page's main action next to "Customize view". The theme's primary.dark (MUI's default hover for a
 * filled button) is near-white, so the hover uses the app's orange accent instead.
 */
export const TableAddButton = ({ label, onClick, "data-testid": testId }: TableAddButtonProps) => (
    <Button
        variant="contained"
        startIcon={<Add />}
        onClick={onClick}
        data-testid={testId}
        sx={{
            mr: 1,
            textTransform: "none",
            "&:hover": { backgroundColor: "secondary.main", color: "text.primary" },
        }}
    >
        {label}
    </Button>
);
