/**
 * @module button.component - The react button component.
 */
import { Button as MaterialButton } from "@mui/material";

/**
 * Defines a button component using mui.
 *
 * @param {string} color - Color for styling.
 * @param {Object} sx - Styles to add to the button.
 * @param {Object} children - Childrens that are added inside the button.
 * @param {Array of objects} props - Properties that are added to the button.
 * @returns React Button component.
 */
export const Button = ({ color = "primary", children, sx, ...props }) => {
    return (
        <MaterialButton
            variant="contained"
            sx={{
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
                ...sx,
            }}
            {...props}
        >
            {children}
        </MaterialButton>
    );
};
