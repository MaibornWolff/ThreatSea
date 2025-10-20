import { Box } from "@mui/material";

export const ListBox = ({ children, sx = {}, ...props }) => {
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
