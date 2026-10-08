import { Box } from "@mui/material";
import type { ReactNode } from "react";

interface ChainDialogContentProps {
    size: "sm" | "md";
    children: ReactNode;
}

/**
 * The body of one chain dialog inside the ChainDialogShell. It is the scroll container, so each
 * dialog starts at the top, and it carries the paper's padding, so checkbox ripples and button
 * shadows aren't clipped.
 *
 * @component
 * @category Components
 */
export const ChainDialogContent = ({ size, children }: ChainDialogContentProps) => (
    <Box
        sx={{
            width: (theme) => theme.breakpoints.values[size],
            maxWidth: "calc(100% - 60px)",
            padding: "30px",
            overflowY: "auto",
            minHeight: 0,
        }}
    >
        {children}
    </Box>
);
