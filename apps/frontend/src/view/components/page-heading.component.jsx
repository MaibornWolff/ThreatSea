import { Box, Typography } from "@mui/material";

export const PageHeading = ({ children }) => {
    return (
        <Box display="flex" justifyContent="space-between" paddingTop={2} paddingBottom={2}>
            <Typography variant="h5">{children}</Typography>
        </Box>
    );
};
