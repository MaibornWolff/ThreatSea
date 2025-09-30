import { styled } from "@mui/material/styles";
import { Tooltip as MaterialTooltip, tooltipClasses } from "@mui/material";

export const Tooltip = styled(({ className, ...props }) => (
    <MaterialTooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: "#98a3b3",
        color: "primary.main",
        boxShadow: theme.shadows[1],
        fontSize: 12,
    },
}));
