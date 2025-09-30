import { MAX_TEXT_LENGTH } from "#view/dialogs/validation-constants.js";
import { forwardRef } from "react";
import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

const BigTextFieldInner = ({ sx, error, fieldName, register, ...props }, ref) => {
    const { t } = useTranslation();
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
                        paddingLeft: 1,
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
            rows={4}
            multiline
            margin="normal"
            error={error}
            {...props}
            {...register(fieldName, {
                validate: {
                    maxLength: (value) => value.length <= MAX_TEXT_LENGTH || t("errorMessages.textTooLong"),
                },
            })}
            helperText={error?.message || ""}
        />
    );
};

export const BigTextField = forwardRef(BigTextFieldInner);
