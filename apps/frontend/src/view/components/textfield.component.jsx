import { TextField as MaterialTextField } from "@mui/material";

export const TextField = ({ children, sx, ...props }) => {
    return (
        <MaterialTextField
            variant="outlined"
            sx={{
                label: {
                    fontSize: "0.75rem",
                    top: "2px",
                    left: "2px",
                },
                "input, textarea": {
                    fontSize: "0.75rem",
                },
                ...sx,
            }}
            {...props}
        >
            {children}
        </MaterialTextField>
    );
};
