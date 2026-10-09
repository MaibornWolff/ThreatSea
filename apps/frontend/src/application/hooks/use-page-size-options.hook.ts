import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// The DataGrid's own page size for "show every row on one page".
export const ALL_ROWS_PAGE_SIZE = -1;

/** The "rows per page" choices shared by all tables, ending with an "All" option. */
export const usePageSizeOptions = () => {
    const { t } = useTranslation("common");
    return useMemo(() => [10, 25, 50, 100, { value: ALL_ROWS_PAGE_SIZE, label: t("allRows") }], [t]);
};
