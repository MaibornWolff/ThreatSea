import { Box } from "@mui/material";
import { ToggleButtons } from "./toggle-buttons.component";

export const MatrixFilterToggleButtonGroup = ({ items, ...props }) => {
    return (
        <Box display="flex" alignItems="center" justifyContent="center" paddingBottom={1} width="100%">
            <ToggleButtons buttons={items} {...props} />
        </Box>
    );
};
