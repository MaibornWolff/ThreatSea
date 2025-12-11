import { useTranslation } from "react-i18next";
import { BigTextField, type BigTextFieldProps } from "./big-textfield.component";
import type { FieldValues, Path } from "react-hook-form";

export const DescriptionTextField = <T extends FieldValues>(props: Omit<BigTextFieldProps<T>, "fieldName">) => {
    const { t } = useTranslation();

    return (
        <BigTextField<T>
            {...(props as BigTextFieldProps<T>)}
            fieldName={"description" as Path<T>}
            label={t("description")}
        />
    );
};
