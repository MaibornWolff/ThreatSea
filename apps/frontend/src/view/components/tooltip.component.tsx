import { styled, type Theme } from "@mui/material/styles";
import { Tooltip as MaterialTooltip, tooltipClasses, type TooltipProps } from "@mui/material";
import { colors } from "#view/wrappers/tokens.ts";

export const Tooltip = styled(({ className, ...props }: TooltipProps) => (
    <MaterialTooltip {...props} classes={{ popper: className ?? "" }} />
))(({ theme }: { theme: Theme }) => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: colors.surface.tooltip,
        color: "primary.main",
        boxShadow: theme.shadows[1],
        fontSize: 12,
    },
}));
