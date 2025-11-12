import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material/TextField";
import { forwardRef, type ForwardedRef } from "react";

const DialogTextFieldInner = ({ sx, ...props }: TextFieldProps, ref: ForwardedRef<HTMLDivElement>): JSX.Element => {
    let paddingLeft = 3;
    if (props.multiline) {
        paddingLeft = 1;
    }

    return (
        <TextField
            ref={ref}
            InputLabelProps={{
                shrink: true,
            }}
            sx={{
                "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#fcac0c !important",
                },
                "& .MuiOutlinedInput-root": {
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#fcac0c !important",
                        borderWidth: "1px !important",
                    },
                    "& .MuiOutlinedInput-input": {
                        paddingLeft,
                        fontSize: "0.875rem",
                    },
                },
                "& .MuiInputLabel-root": {
                    marginLeft: 1,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                    borderRadius: 5,
                    borderColor: "primary.main",
                },
                legend: {
                    marginLeft: 1,
                },
                textarea: {
                    paddingLeft: 1,
                },
                ...sx,
            }}
            {...props}
        />
    );
};

export const DialogTextField = forwardRef<HTMLDivElement, TextFieldProps>(DialogTextFieldInner);
