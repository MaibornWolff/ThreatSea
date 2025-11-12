import { Box, FormControlLabel, Switch, Typography, type SwitchProps } from "@mui/material";
import type { ReactNode } from "react";

interface PointOfAttackSwitchProps extends Omit<SwitchProps, "color"> {
    color: string;
    label: ReactNode;
}

export const PointOfAttackSwitch = ({ color, label, ...props }: PointOfAttackSwitchProps) => {
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
