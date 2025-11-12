import { Box, type BoxProps, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

interface ListBoxProps extends BoxProps {
    children: ReactNode;
    sx?: SxProps<Theme>;
}

export const ListBox = ({ children, sx = {}, ...props }: ListBoxProps) => {
    return (
        <Box
            sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "background.paperIntransparent",
                padding: 3,
                borderRadius: 5,
                boxShadow: 1,
                ...sx,
            }}
            {...props}
        >
            {children}
        </Box>
    );
};
