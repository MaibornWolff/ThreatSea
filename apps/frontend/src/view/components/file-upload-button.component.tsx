import type { ReactNode } from "react";
import type { ButtonProps } from "@mui/material/Button";
import { Button } from "./button.component";

interface FileUploadButtonProps extends Omit<ButtonProps, "id" | "children" | "sx"> {
    id?: string;
    children?: ReactNode;
    sx?: Record<string, unknown>;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const FileUploadButton = ({ id, children, inputProps, ...props }: FileUploadButtonProps) => (
    <label htmlFor={id}>
        <input id={id} type="file" {...inputProps} style={{ display: "none" }} />
        <Button component="span" color="primary" {...props}>
            {children}
        </Button>
    </label>
);
