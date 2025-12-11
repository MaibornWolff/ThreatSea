import { Button as MaterialButton } from "@mui/material";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";
import type { ReactNode } from "react";

type ButtonComponentProps = {
    color?: MuiButtonProps["color"];
    sx?: Record<string, unknown>;
    children?: ReactNode;
} & Omit<MuiButtonProps, "color" | "sx" | "children">;

export const Button = ({ color = "primary", children, sx, ...props }: ButtonComponentProps) => {
    const combinedSx: MuiButtonProps["sx"] = {
        mr: 1,
        pt: 0.5,
        pb: 0.5,
        borderRadius: 5,
        backgroundColor: "background.paperLight",
        textDecoration: "none",
        textTransform: "initial",
        color: "text.primary",
        "&:hover": {
            bgcolor: `${color}.light`,
            color: color == "success" ? "text.white" : color == "error" ? "text.white" : "text.primary",
        },
        ...(sx ?? {}),
    };

    return (
        <MaterialButton variant="contained" sx={combinedSx} {...props}>
            {children}
        </MaterialButton>
    );
};
