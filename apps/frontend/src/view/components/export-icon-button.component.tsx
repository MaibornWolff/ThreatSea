import FileDownload from "@mui/icons-material/FileDownload";
import type { IconButtonProps as MuiIconButtonProps } from "@mui/material/IconButton";
import type { ReactNode } from "react";

import { IconButton } from "./icon-button.component";

type ExportIconButtonProps = Omit<MuiIconButtonProps, "title"> & {
    title?: ReactNode;
    hoverColor?: string;
    fontSize?: number | "large" | "medium" | "small" | "inherit";
};

export const ExportIconButton = ({ fontSize, ...props }: ExportIconButtonProps) => {
    return (
        <IconButton {...props}>
            <FileDownload sx={{ fontSize: fontSize ?? 18 }} />
        </IconButton>
    );
};
