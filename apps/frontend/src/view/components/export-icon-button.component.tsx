import { FileDownload } from "@mui/icons-material";
import type { IconButtonProps as MuiIconButtonProps } from "@mui/material/IconButton";
import type { ReactNode } from "react";

import { IconButton } from "./icon-button.component";

type ExportIconButtonProps = Omit<MuiIconButtonProps, "title"> & {
    title?: ReactNode;
    hoverColor?: string;
};

export const ExportIconButton = (props: ExportIconButtonProps) => {
    return (
        <IconButton {...props}>
            <FileDownload sx={{ fontSize: 18 }} />
        </IconButton>
    );
};
