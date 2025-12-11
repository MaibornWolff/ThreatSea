import { FileUpload } from "@mui/icons-material";
import { IconButton } from "./icon-button.component";
import type { InputHTMLAttributes } from "react";

interface ImportIconButtonProps extends InputHTMLAttributes<HTMLInputElement> {
    id: string;
    tooltipTitle: string;
}

export const ImportIconButton = ({ id, tooltipTitle, ...props }: ImportIconButtonProps) => {
    return (
        <label htmlFor={id}>
            <input id={id} type="file" accept=".csv, application/JSON" style={{ display: "none" }} {...props} />
            <IconButton component="span" title={tooltipTitle} sx={{ color: "text.primary" }}>
                <FileUpload sx={{ fontSize: 18 }} />
            </IconButton>
        </label>
    );
};
