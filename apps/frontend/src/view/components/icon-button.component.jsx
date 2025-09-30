import { IconButton as MaterialIconButton } from "@mui/material";
import { Tooltip } from "./tooltip.component";

export const IconButton = ({ hoverColor = "secondary", title, sx, children, ...props }) => {
    return title ? (
        <Tooltip title={title}>
            <MaterialIconButton
                sx={{
                    "&:hover": {
                        color: `${hoverColor}.main`,
                        bgcolor: "background.paper",
                    },
                    ...sx,
                }}
                color="primary"
                {...props}
            >
                {children}
            </MaterialIconButton>
        </Tooltip>
    ) : (
        <MaterialIconButton
            sx={{
                "&:hover": {
                    color: `${hoverColor}.main`,
                    bgcolor: "background.paper",
                },
                ...sx,
            }}
            color="primary"
            {...props}
        >
            {children}
        </MaterialIconButton>
    );
};
