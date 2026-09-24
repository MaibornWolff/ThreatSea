import { Box, Typography } from "@mui/material";

export const NoRowsOverlay = ({ message }: { message: string }) => (
    <Box
        sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <Typography sx={{ fontSize: "0.75rem", fontStyle: "italic" }}>{message}</Typography>
    </Box>
);
