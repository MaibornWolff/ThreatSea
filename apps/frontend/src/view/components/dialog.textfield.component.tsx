import { TextField } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { TextFieldProps } from "@mui/material/TextField";
import type { JSX } from "react";

export const DialogTextField = ({ sx, ...props }: TextFieldProps): JSX.Element => {
    const theme = useTheme();
    let paddingLeft = 3;
    if (props.multiline) {
        paddingLeft = 1;
    }

    return (
        <TextField
            slotProps={{
                inputLabel: {
                    shrink: true,
                },
            }}
            sx={{
                "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: `${theme.palette.secondary.main} !important`,
                },
                "& .MuiOutlinedInput-root": {
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: `${theme.palette.secondary.main} !important`,
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
