import { Typography, Box } from "@mui/material";
import type { ReactNode } from "react";

interface ListBoxHeaderProps {
    title: ReactNode;
}

export const ListBoxHeader = ({ title }: ListBoxHeaderProps) => {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 2,
            }}
        >
            <Typography
                sx={{
                    fontWeight: "bold",
                    color: "text.primary",
                    verticalAlign: "middle",
                }}
                variant="h6"
            >
                {title}
            </Typography>
        </Box>
    );
};
