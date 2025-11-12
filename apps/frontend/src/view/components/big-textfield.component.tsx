import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material/TextField";
import type { ForwardedRef, ReactElement, RefAttributes } from "react";
import { forwardRef } from "react";
import type { FieldError, FieldPath, FieldValues, UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { MAX_TEXT_LENGTH } from "#view/dialogs/validation-constants.ts";

export type BigTextFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
    TextFieldProps,
    "error" | "sx" | "ref"
> & {
    sx?: TextFieldProps["sx"];
    error?: FieldError | undefined;
    fieldName: FieldPath<TFieldValues>;
    register: UseFormRegister<TFieldValues>;
};

const BigTextFieldInner = <TFieldValues extends FieldValues>(
    { sx, error, fieldName, register, ...props }: BigTextFieldProps<TFieldValues>,
    ref: ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) => {
    const { t } = useTranslation();
    return (
        <TextField
            // @ts-expect-error TODO: Fix ref typing
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
            error={Boolean(error)}
            {...props}
            {...register(fieldName, {
                validate: {
                    maxLength: (value: string) => value.length <= MAX_TEXT_LENGTH || t("errorMessages.textTooLong"),
                },
            })}
            helperText={error?.message || ""}
        />
    );
};

type BigTextFieldComponent = <TFieldValues extends FieldValues = FieldValues>(
    props: BigTextFieldProps<TFieldValues> & RefAttributes<HTMLInputElement | HTMLTextAreaElement>
) => ReactElement | null;

export const BigTextField = forwardRef(BigTextFieldInner) as BigTextFieldComponent;
