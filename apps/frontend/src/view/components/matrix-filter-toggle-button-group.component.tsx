import { Box } from "@mui/material";
import { ToggleButtons } from "./toggle-buttons.component";
import type { ToggleButtonConfig, ToggleButtonsProps } from "./toggle-buttons.component";

interface MatrixFilterToggleButtonGroupProps extends Omit<ToggleButtonsProps, "buttons"> {
    items: ToggleButtonConfig[];
}

export const MatrixFilterToggleButtonGroup = ({ items, ...props }: MatrixFilterToggleButtonGroupProps) => {
    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                paddingBottom: 1,
                width: "100%",
            }}
        >
            <ToggleButtons buttons={items} {...props} />
        </Box>
    );
};
