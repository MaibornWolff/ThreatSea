import { MAX_NAME_LENGTH } from "#view/dialogs/validation-constants.ts";
import { TextField } from "@mui/material";
import type { TextFieldProps } from "@mui/material/TextField";
import type { SxProps, Theme } from "@mui/material/styles";
import { forwardRef } from "react";
import type { ForwardedRef, ReactElement, RefAttributes } from "react";
import type { FieldError, FieldPath, FieldValues, Path, UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAssets } from "../../application/hooks/use-assets.hook";
import { useMeasures } from "../../application/hooks/use-measures.hook";
import { editorSelectors } from "../../application/selectors/editor.selectors";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";

type OwnId = number | string | null | undefined;

type BaseNameTextFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
    TextFieldProps,
    "error" | "sx" | "type"
> & {
    fieldName: FieldPath<TFieldValues>;
    register: UseFormRegister<TFieldValues>;
    error?: FieldError | undefined;
    ownId?: OwnId;
    type?: string;
    catalogId?: number | undefined;
    projectId?: number | undefined;
    defaultSx?: SxProps<Theme>;
    sx?: SxProps<Theme>;
};

type NameTextFieldProps<TFieldValues extends FieldValues = FieldValues> = Omit<
    BaseNameTextFieldProps<TFieldValues>,
    "fieldName" | "defaultSx"
>;

const BaseNameTextFieldInner = <TFieldValues extends FieldValues>(
    {
        placeholder,
        error,
        defaultSx,
        sx,
        fieldName,
        register,
        ownId,
        type,
        projectId,
        ...props
    }: BaseNameTextFieldProps<TFieldValues>,
    ref: ForwardedRef<HTMLDivElement>
) => {
    const { t } = useTranslation();

    const { items: projectMeasureItems } = useMeasures({ projectId: projectId as number });
    const { items: assetsItems } = useAssets({ projectId: projectId as number });

    const customComponents = useAppSelector((state) => editorSelectors.selectCustomComponents(state, projectId));

    const isNameUnique = (value: string) => {
        const trimmedValue = value.trim();

        if (type === "measure") {
            const measureExistsInProject =
                projectId &&
                projectMeasureItems?.some((item) => item.name?.trim() === trimmedValue && item.id !== ownId);

            return !measureExistsInProject;
        }

        if (type === "asset") {
            const assetExists =
                projectId && assetsItems?.some((item) => item.name?.trim() === trimmedValue && item.id !== ownId);

            return !assetExists;
        }

        if (type === "component") {
            const componentExists =
                projectId && customComponents?.some((item) => item.name?.trim() === trimmedValue && item.id !== ownId);

            return !componentExists;
        }

        return true;
    };

    const mergedSx: SxProps<Theme> = {
        ...(defaultSx ? (defaultSx as Record<string, unknown>) : {}),
        ...(sx ?? {}),
    };

    return (
        <TextField
            // @ts-expect-error TODO: Fix ref typing
            ref={ref}
            sx={mergedSx}
            autoFocus
            autoComplete="off"
            type={type as TextFieldProps["type"]}
            {...props}
            {...register(fieldName, {
                validate: {
                    required: (value: string) => !!value.trim() || t("errorMessages.nameRequired"),
                    maxLength: (value: string) => value.length <= MAX_NAME_LENGTH || t("errorMessages.nameTooLong"),
                    nameUnique: (value: string) => isNameUnique(value) || t("errorMessages.nameNotUnique"),
                },
            })}
            helperText={error?.message ?? ""}
            placeholder={placeholder ?? ""}
            error={Boolean(error)}
        />
    );
};

type BaseNameTextFieldComponent = <TFieldValues extends FieldValues = FieldValues>(
    props: BaseNameTextFieldProps<TFieldValues> & RefAttributes<HTMLDivElement>
) => ReactElement | null;

const BaseNameTextField = forwardRef(BaseNameTextFieldInner) as BaseNameTextFieldComponent;

const nameTextFieldSx = <TFieldValues extends FieldValues>(
    props: NameTextFieldProps<TFieldValues>
): SxProps<Theme> => ({
    marginBottom: 1,
    border: "none !important",
    "& .MuiInputBase-root": {
        borderBottom: "1px solid rgba(35, 60, 87, 0) !important",
    },
    "*": {
        border: "none !important",
        padding: "0 !important",
        borderRadius: "0 !important",
        fontWeight: "bold",
    },
    "& .Mui-focused": {
        borderBottom: "1px solid rgba(35, 60, 87, 1) !important",
    },
    "& .MuiFormHelperText-root": {
        color: props.error ? "#d32f2f" : "inherit",
        margin: "4px 0 0 8px",
        fontWeight: "normal",
        fontSize: "0.75rem",
        borderBottom: "none !important",
        "&.Mui-focused": {
            borderBottom: "none !important",
        },
    },
    input: {
        fontSize: "0.875rem !important",
        width: "100% !important",
        autoComplete: "off",
    },
    "input::placeholder": {
        color: props.error ? "#d32f2f" : "initial",
        opacity: props.error ? 0.7 : 0.5,
    },
    color: "text.primary !important",
    padding: "0 !important",
});

const boxNameTextFieldSx = <TFieldValues extends FieldValues>(
    props: NameTextFieldProps<TFieldValues>
): SxProps<Theme> => ({
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "#fcac0c !important",
    },
    "& .MuiOutlinedInput-root": {
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#fcac0c !important",
            borderWidth: "1px !important",
        },
        "& .MuiOutlinedInput-input": {
            paddingLeft: props.multiline ? 1 : 3,
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
});

const NameTextFieldInner = <TFieldValues extends FieldValues>(
    props: NameTextFieldProps<TFieldValues>,
    ref: ForwardedRef<HTMLDivElement>
) => {
    const { t } = useTranslation();

    return (
        <BaseNameTextField
            fieldName={"name" as Path<TFieldValues>}
            placeholder={t("name")}
            catalogId={props.catalogId}
            {...props}
            ref={ref}
            defaultSx={nameTextFieldSx(props)}
        />
    );
};

type NameTextFieldComponent = <TFieldValues extends FieldValues = FieldValues>(
    props: NameTextFieldProps<TFieldValues> & RefAttributes<HTMLDivElement>
) => ReactElement | null;

export const NameTextField = forwardRef(NameTextFieldInner) as NameTextFieldComponent;

const BoxNameTextFieldInner = <TFieldValues extends FieldValues>(
    props: NameTextFieldProps<TFieldValues>,
    ref: ForwardedRef<HTMLDivElement>
) => {
    const { t } = useTranslation();

    return (
        <BaseNameTextField
            InputLabelProps={{ shrink: true }}
            fieldName={"name" as Path<TFieldValues>}
            label={t("name")}
            projectId={props.projectId}
            {...props}
            ref={ref}
            defaultSx={boxNameTextFieldSx(props)}
        />
    );
};

type BoxNameTextFieldComponent = <TFieldValues extends FieldValues = FieldValues>(
    props: NameTextFieldProps<TFieldValues> & RefAttributes<HTMLDivElement>
) => ReactElement | null;

export const BoxNameTextField = forwardRef(BoxNameTextFieldInner) as BoxNameTextFieldComponent;
