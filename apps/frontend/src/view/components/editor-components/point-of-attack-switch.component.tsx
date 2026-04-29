import { Box, Switch, Typography, type SwitchProps } from "@mui/material";
import type { MouseEvent, ReactNode } from "react";

export interface PointOfAttackSwitchProps extends Omit<SwitchProps, "color"> {
    color: string;
    label: ReactNode;
    ariaLabel: string;
    onLabelClick: (event: MouseEvent<HTMLElement>) => void;
}

export const PointOfAttackSwitch = ({ color, label, ariaLabel, onLabelClick, ...props }: PointOfAttackSwitchProps) => (
    <Box
        sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            color: "text.primary",
            marginBottom: 1,
            fontSize: "0.75rem",
            marginLeft: "-11px",
        }}
    >
        <Switch
            size="small"
            slotProps={{ input: { role: "switch", "aria-label": ariaLabel } }}
            sx={{
                "& .MuiSwitch-switchBase": {
                    "&.Mui-checked": {
                        "& + .MuiSwitch-track": { backgroundColor: color },
                    },
                },
                "& .MuiSwitch-thumb": { backgroundColor: color },
            }}
            {...props}
        />
        <Typography
            component="span"
            onClick={onLabelClick}
            sx={{
                fontSize: "0.75rem",
                marginLeft: 1,
                cursor: "default",
                ...(props.checked && {
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                }),
            }}
        >
            {label}
        </Typography>
    </Box>
);
