import { IconButton as MaterialIconButton } from "@mui/material";
import type { IconButtonProps as MuiIconButtonProps } from "@mui/material/IconButton";
import { Tooltip } from "./tooltip.component";
import type { ReactNode } from "react";

type IconButtonProps = Omit<MuiIconButtonProps, "title"> & {
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

    const button = (
        <MaterialIconButton
            sx={combinedSx}
            color="primary"
            aria-label={typeof title === "string" ? title : undefined}
            {...props}
        >
            {children}
        </MaterialIconButton>
    );

    if (!title) {
        return button;
    }

    return (
        <Tooltip title={title}>
            {props.disabled ? (
                // Disabled buttons fire no pointer events, so the tooltip's listeners must
                // sit on a wrapper that still receives them (MUI's documented pattern).
                <span style={{ display: "inline-flex" }}>{button}</span>
            ) : (
                button
            )}
        </Tooltip>
    );
};
