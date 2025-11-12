import { TextField as MaterialTextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material/TextField";

type Props = TextFieldProps;

export const TextField = ({ children, sx, ...props }: Props) => {
    const inlineSx = (sx ?? {}) as Record<string, unknown>;

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
                ...inlineSx,
            }}
            {...props}
        >
            {children}
        </MaterialTextField>
    );
};
