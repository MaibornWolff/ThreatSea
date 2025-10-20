import { Typography, Box } from "@mui/material";

export const ListBoxHeader = ({ title }) => {
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
