import { useTranslation } from "react-i18next";
import { BigTextField } from "./big-textfield.component";

export const DescriptionTextField = (props) => {
    const { t } = useTranslation();

    return <BigTextField {...props} fieldName={"description"} label={t("description")} />;
};
