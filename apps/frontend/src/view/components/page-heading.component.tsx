import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface PageHeadingProps {
    children: ReactNode;
}

export const PageHeading = ({ children }: PageHeadingProps) => {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 2,
                paddingBottom: 2,
            }}
        >
            <Typography variant="h5">{children}</Typography>
        </Box>
    );
};
