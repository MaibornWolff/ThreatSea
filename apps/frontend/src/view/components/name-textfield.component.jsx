import { MAX_NAME_LENGTH } from "#view/dialogs/validation-constants";
import { TextField } from "@mui/material";
import { forwardRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useCatalogMeasures } from "../../application/hooks/use-catalog-measures.hook.js";
import { useMeasures } from "../../application/hooks/use-measures.hook.js";
import { useAssets } from "../../application/hooks/use-assets.hook.js";
import { useEditor } from "../../application/hooks/use-editor.hook";
import { editorSelectors } from "../../application/selectors/editor.selectors";

const BaseNameTextField = (
    { placeholder, error, defaultSx, sx, fieldName, register, ownId, type, catalogId, projectId, ...props },
    ref
) => {
    const { t } = useTranslation();

    const {
        items: projectMeasureItems,
        isPending: projectMeasurePending,
        loadMeasures,
        deleteMeasure,
    } = useMeasures({ projectId });

    const { isPending: assetPending, items: assetsItems, loadAssets, deleteAsset } = useAssets({ projectId });

    const customComponents = useSelector((state) => editorSelectors.selectCustomComponents(state, projectId));

    const isNameUnique = (value) => {
        const trimmedValue = value.trim();
        if (type == "measure") {
            // Only check project if projectId is defined
            const measureExistsInProject =
                projectId &&
                projectMeasureItems?.some((item) => item.name?.trim() === trimmedValue && item.id !== ownId);
            return !measureExistsInProject; //!measureExistsInCatalog &&
        } else if (type == "asset") {
            const assetExists =
                projectId && assetsItems?.some((item) => item.name?.trim() === trimmedValue && item.id !== ownId);
            return !assetExists;
        } else if (type == "component") {
            const componentExists =
                projectId && customComponents?.some((item) => item.name?.trim() === trimmedValue && item.id !== ownId);
            return !componentExists;
        } else return true;
    };

    return (
        <TextField
            ref={ref}
            sx={{
                ...defaultSx,
                ...sx,
            }}
            autoFocus
            autoComplete="off"
            type={type}
            {...props}
            {...register(fieldName, {
                validate: {
                    required: (value) => !!value.trim() || t("errorMessages.nameRequired"),
                    maxLength: (value) => value.length <= MAX_NAME_LENGTH || t("errorMessages.nameTooLong"),
                    nameUnique: (value) => isNameUnique(value) || t("errorMessages.nameNotUnique"),
                },
            })}
            helperText={error?.message || ""}
            placeholder={placeholder}
            error={error}
        />
    );
};

const nameTextFieldSx = (props) => ({
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

const boxNameTextFieldSx = (props) => ({
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

export const NameTextField = forwardRef((props, ref) => {
    const { t } = useTranslation();

    return (
        <BaseNameTextField
            fieldName="name"
            placeholder={t("name")}
            catalogId={props.catalogId}
            {...props}
            ref={ref}
            defaultSx={nameTextFieldSx(props)}
        />
    );
});
NameTextField.displayName = "NameTextField";

export const BoxNameTextField = forwardRef((props, ref) => {
    const { t } = useTranslation();

    return (
        <BaseNameTextField
            InputLabelProps={{ shrink: true }}
            fieldName="name"
            label={t("name")}
            projectId={props.projectId}
            {...props}
            ref={ref}
            defaultSx={boxNameTextFieldSx(props)}
        />
    );
});
BoxNameTextField.displayName = "BoxNameTextField";
