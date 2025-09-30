import { Box, FormControlLabel, Switch, Typography } from "@mui/material";

export const PointOfAttackSwitch = ({ color, label, ...props }) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 1,
                color: "text.primary",
                fontSize: "0.75rem",
            }}
        >
            <FormControlLabel
                control={
                    <Switch
                        size="small"
                        sx={{
                            "& .MuiSwitch-switchBase": {
                                "&.Mui-checked": {
                                    "& + .MuiSwitch-track": {
                                        backgroundColor: color,
                                    },
                                },
                            },
                            "& .MuiSwitch-thumb": {
                                backgroundColor: color,
                            },
                        }}
                        {...props}
                    />
                }
                label={
                    <Typography
                        sx={{
                            fontSize: "0.75rem",
                            marginLeft: 1,
                        }}
                    >
                        {label}
                    </Typography>
                }
            />
        </Box>
    );
};

/**
 *
 *
<Box
    sx={{
        backgroundColor: color,
        width: "16px",
        height: "16px",
        marginLeft: 1,
        borderRadius: 50,
    }}
></Box> */
