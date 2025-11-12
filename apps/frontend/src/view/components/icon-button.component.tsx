import { IconButton as MaterialIconButton } from "@mui/material";
import type { IconButtonProps as MuiIconButtonProps } from "@mui/material/IconButton";
import { Tooltip } from "./tooltip.component";
import type { ReactNode } from "react";

export type IconButtonProps = Omit<MuiIconButtonProps, "title"> & {
    hoverColor?: string;
    title?: ReactNode;
};

export const IconButton = ({ hoverColor = "secondary", title, sx, children, ...props }: IconButtonProps) => {
    const defaultStyles = {
        "&:hover": {
            color: `${hoverColor}.main`,
            bgcolor: "background.paper",
        },
    };

    const combinedSx: MuiIconButtonProps["sx"] =
        sx == null ? defaultStyles : Array.isArray(sx) ? [defaultStyles, ...sx] : [defaultStyles, sx];

    return title ? (
        <Tooltip title={title}>
            <MaterialIconButton sx={combinedSx} color="primary" {...props}>
                {children}
            </MaterialIconButton>
        </Tooltip>
    ) : (
        <MaterialIconButton sx={combinedSx} color="primary" {...props}>
            {children}
        </MaterialIconButton>
    );
};
