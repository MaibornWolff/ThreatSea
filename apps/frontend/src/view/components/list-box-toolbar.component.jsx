import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Add, ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { SearchField } from "../components/search-field.component";
import { ToggleButtons } from "./toggle-buttons.component";
import { IconButton } from "./icon-button.component";
import { ExportIconButton } from "./export-icon-button.component";
import { ImportIconButton } from "./import-icon-button.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";

export const ListBoxToolbar = ({
    type,
    setSearchValue,
    setSortBy,
    setSortDirection,
    sortDirection,
    sortBy,
    buttonText,
    importText,
    exportText,
    onAdd,
    onExport,
    onImport,
    importIconButtonProps,
    userRole,
}) => {
    const { t } = useTranslation("catalogPage");
    const onChangeSearchValue = (e) => {
        setSearchValue(e.target.value);
    };

    const onChangeSortBy = (e, sortBy) => {
        if (sortBy) {
            setSortBy(sortBy);
        }
    };

    const onChangeSortDirection = (e, sortDirection) => {
        if (sortDirection) {
            setSortDirection(sortDirection);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 1,
                marginRight: 4,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "row",
                }}
            >
                <SearchField
                    iconButtonProps={{ p: 0.5 }}
                    onChange={onChangeSearchValue}
                    data-testid="SearchThreats"
                    sx={{
                        width: "180px",
                    }}
                />
                {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                    <IconButton
                        title={buttonText}
                        data-testid={`catalog-page_add-${type}-button`}
                        onClick={onAdd}
                        sx={{
                            marginLeft: 2,
                            marginRight: 0.5,
                            color: "text.primary",
                        }}
                    >
                        <Add sx={{ fontSize: 18 }} />
                    </IconButton>
                )}
                {onExport && <ExportIconButton title={exportText} onClick={onExport} sx={{ color: "text.primary" }} />}
                {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                    <ImportIconButton tooltipTitle={importText} onChange={onImport} {...importIconButtonProps} />
                )}
            </Box>
            <Box
                sx={{
                    color: "primary.main",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <ToggleButtons
                    value={sortDirection}
                    onChange={onChangeSortDirection}
                    buttons={[
                        {
                            icon: ArrowUpward,
                            value: "asc",
                            "data-testid": `catalog-page_ascending-${type}s-sort-button`,
                        },
                        {
                            icon: ArrowDownward,
                            value: "desc",
                            "data-testid": `catalog-page_descending-${type}s-sort-button`,
                        },
                    ]}
                />
                <ToggleButtons
                    onChange={onChangeSortBy}
                    value={sortBy}
                    sx={{
                        ml: 1,
                    }}
                    buttonProps={{
                        width: "75px",
                    }}
                    buttons={[
                        {
                            text: t("name"),
                            value: "name",
                            "data-testid": `catalog-page_sort-${type}s-by-name-button`,
                        },
                        {
                            text: t("creationDate"),
                            value: "createdAt",
                            "data-testid": `catalog-page_sort-${type}s-by-date-button`,
                        },
                    ]}
                />
            </Box>
        </Box>
    );
};
