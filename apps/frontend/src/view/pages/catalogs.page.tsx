/**
 * @module catalogs.page - Defines the catalogues
 *     overview page.
 */

import { Add, ArrowDownward, ArrowUpward, Delete, Edit } from "@mui/icons-material";
import {
    Box,
    LinearProgress,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Tooltip,
    Typography,
} from "@mui/material";
import { useLayoutEffect, type ChangeEvent, type MouseEvent as ReactMouseEvent, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Route, Routes } from "react-router-dom";
import type { CatalogWithRole } from "#api/types/catalogs.types.ts";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useCatalogsList } from "../../application/hooks/use-catalogs-list.hook";
import { useCatalogs } from "../../application/hooks/use-catalogs.hook";
import { useAppDispatch } from "../../application/hooks/use-app-redux.hook";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { IconButton } from "../components/icon-button.component";
import { PageHeading } from "../components/page-heading.component";
import { Page } from "../components/page.component";
import { SearchField } from "../components/search-field.component";
import { ToggleButtons } from "../components/toggle-buttons.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { useUser } from "../../application/hooks/use-user.hook";
import CatalogDialogPage from "./catalog-dialog.page";

interface CatalogListItemProps {
    catalog: CatalogWithRole;
    onClick: (event: ReactMouseEvent<HTMLElement>, catalog: CatalogWithRole) => void;
    onClickEdit: (event: ReactMouseEvent<HTMLElement>, catalog: CatalogWithRole | null) => void;
    onClickDelete: (event: ReactMouseEvent<HTMLElement>, catalog: CatalogWithRole) => void;
    [key: string]: unknown;
}

/**
 * Creates a page for a listing of all catalogues threatsea has defined.
 *
 * @returns The Catalogues page.
 */
const CatalogsPageBody = () => {
    const { openConfirm } = useConfirm<CatalogWithRole>();
    const navigate = useNavigate();
    const {
        t,
        i18n: { language },
    } = useTranslation("catalogsPage");

    const { setSortDirection, setSearchValue, setSortBy, isPending, sortDirection, sortBy, catalogs } =
        useCatalogsList();

    const { isPrivileged } = useUser();

    const { deleteCatalog } = useCatalogs();

    const dispatch = useAppDispatch();

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: false,
                showUniversalHeaderNavigation: true,
                showProjectInfo: false,
                getCatalogInfo: false,
            })
        );
    }, [dispatch]);

    /**
     * Opens the catalogue dialog to add one.
     *
     * @event IconButton#onClick
     * @param {SyntheticBaseEvent} e - Onclick event.
     */
    const onClickAddCatalog = (event: ReactMouseEvent<HTMLElement>) => {
        onClickEditCatalog(event, null);
    };

    /**
     * Changes the search value of the catalogues.
     *
     * @event SearchField#onChange
     * @param {SyntheticBaseEvent} e - OnChange event.
     */
    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    /**
     * Sets the attribute to sort the catalogues by.
     *
     * @event ToggleButtons#onChange
     * @param {SyntheticBaseEvent} e - Onchange event.
     * @param {string} sortBy - The string attribute to sort by.
     */
    const onChangeSortBy = (_event: SyntheticEvent, sortBy: string | null) => {
        if (sortBy) {
            setSortBy(sortBy);
        }
    };

    /**
     * Sets the order of sorting => asc/desc.
     *
     * @event ToggleButtons#onChange
     * @param {SyntheticBaseEvent} e - Onchange event.
     * @param {string} sortDirection - The key value to filter for.
     */
    const onChangeSortDirection = (_event: SyntheticEvent, sortDirection: "asc" | "desc" | null) => {
        if (sortDirection) {
            setSortDirection(sortDirection);
        }
    };

    /**
     * Opens the clicked catalogue.
     *
     * @event CatalogListItem#onClick
     * @param {SyntheticBaseEvent} e - Onclick event.
     * @param {object} catalog - Data of the catalogue.
     */
    const onClickOpenCatalog = (_event: ReactMouseEvent<HTMLElement>, catalog: CatalogWithRole) => {
        navigate(`/catalogs/${catalog.id}`, { state: { catalog } });
    };

    /**
     * Lets the user edit a catalogue when he clicks
     * on it.
     *
     * @event CatalogListItem#onClickEdit
     * @param {SyntheticBaseEvent} e - Onclick edit event.
     * @param {object} catalog - Data of the catalogue.
     */
    const onClickEditCatalog = (_event: ReactMouseEvent<HTMLElement>, catalog: CatalogWithRole | null) => {
        navigate("/catalogs/edit", { state: { catalog } });
    };

    /**
     * Opens the confirmation dialog to delete the specified
     * catalogue.
     *
     * @event CatalogListItem#onClickDelete
     * @param {SyntheticBaseEvent} e - Onclick delete event.
     * @param {object} catalog - Data of the catalogue.
     */
    const onClickDeleteCatalog = (_event: ReactMouseEvent<HTMLElement>, catalog: CatalogWithRole) => {
        openConfirm({
            state: catalog,
            message: t("deleteMessage", { catalogName: catalog.name }),
            acceptText: t("delete"),
            cancelText: t("cancel"),
            onAccept: (catalog) => {
                deleteCatalog(catalog);
            },
        });
    };

    return (
        <Box sx={{ overflowY: "hidden", overflowX: "visible" }}>
            {<LinearProgress sx={{ visibility: isPending ? "visible" : "hidden" }} />}
            <Page sx={{ overflowX: "visible" }}>
                <PageHeading>{t("heading")}</PageHeading>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 1,
                        paddingBottom: 2,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <SearchField onChange={onChangeSearchValue} />
                        {isPrivileged && (
                            <IconButton
                                onClick={onClickAddCatalog}
                                sx={{
                                    ml: 1,
                                    "&:hover": {
                                        color: "secondary.main",
                                        bgcolor: "background.paper",
                                    },
                                    color: "text.primary",
                                }}
                            >
                                <Tooltip title={t("addCatalogBtn")} data-testid="catalogs-page_add-catalog-button">
                                    <Add sx={{ fontSize: 18 }} />
                                </Tooltip>
                            </IconButton>
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            marginRight: 4,
                        }}
                    >
                        <ToggleButtons
                            onChange={onChangeSortDirection}
                            value={sortDirection}
                            buttons={[
                                {
                                    icon: ArrowUpward,
                                    value: "asc",
                                    "data-testid": "catalogs-page_ascending-catalogs-sort-button",
                                },
                                {
                                    icon: ArrowDownward,
                                    value: "desc",
                                    "data-testid": "catalogs-page_descending-catalogs-sort-button",
                                },
                            ]}
                        />
                        <ToggleButtons
                            value={sortBy}
                            onChange={onChangeSortBy}
                            sx={{ ml: 1 }}
                            buttonProps={{
                                width: "75px",
                            }}
                            buttons={[
                                {
                                    text: t("catalogList.sortBy.nameToggleBtn"),
                                    value: "name",
                                    "data-testid": "catalogs-page_sort-catalogs-by-name-button",
                                },
                                {
                                    text: t("catalogList.sortBy.createdAtToggleBtn"),
                                    value: "createdAt",
                                    "data-testid": "catalogs-page_sort-catalogs-by-date-button",
                                },
                            ]}
                        />
                    </Box>
                </Box>
                <List
                    sx={{
                        overflowY: "scroll",
                        overflowX: "visible",
                        paddingRight: 2,
                        paddingTop: 0,
                        marginBottom: 2,
                    }}
                >
                    {catalogs.map((catalog, i) => {
                        return (
                            <CatalogListItem
                                key={i}
                                catalog={catalog}
                                langugage={language}
                                onClick={onClickOpenCatalog}
                                onClickEdit={onClickEditCatalog}
                                onClickDelete={onClickDeleteCatalog}
                                data-testid="catalogs-page_catalogs-list-entry"
                            />
                        );
                    })}
                </List>
            </Page>
            <Routes>
                <Route path="edit" element={<CatalogDialogPage />} />
            </Routes>
        </Box>
    );
};

/**
 * Creates on row list item for a catalogue.
 *
 * @param {object} catalog - The catalogue data.
 * @param {function} onClick - The onclick function for the item.
 * @param {function} onClickEdit - The edit function for the item.
 * @param {function} onClickDelete - The delete function for the item.
 * @returns The catalogue list item.
 */
const CatalogListItem = ({ catalog, onClick, onClickEdit, onClickDelete, ...props }: CatalogListItemProps) => {
    const { name, language } = catalog;
    const { t } = useTranslation("catalogsPage");

    return (
        <ListItem
            divider
            component={Box}
            onClick={(e) => onClick(e, catalog)}
            sx={{
                cursor: "pointer",
                color: "text.primary",
                overflowX: "visible",
                backgroundColor: "background.paperIntransparent",
                borderRadius: 5,
                boxShadow: 1,
                marginBottom: 1,
            }}
            {...props}
        >
            <ListItemText
                primary={
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem" }}>
                        {name}
                        <Typography sx={{ display: "inline", textTransform: "uppercase", marginLeft: "0.25rem" }}>
                            <sub>{language}</sub>
                        </Typography>
                    </Typography>
                }
                data-testid="catalogs-page_catalogs-list-entry_name"
            />
            {checkUserRole(catalog.role, USER_ROLES.OWNER) && (
                <ListItemSecondaryAction>
                    <IconButton
                        data-testid="catalogs-page_rename-catalog-button"
                        onClick={(e) => onClickEdit(e, catalog)}
                        title={t("editCatalogBtn")}
                        sx={{
                            color: "text.primary",
                        }}
                    >
                        <Edit sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                        data-testid="catalogs-page_catalogs-list-entry_delete-button"
                        title={t("deleteCatalogBtn")}
                        hoverColor="error"
                        sx={{
                            color: "text.primary",
                        }}
                        onClick={(e) => onClickDelete(e, catalog)}
                    >
                        <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                </ListItemSecondaryAction>
            )}
        </ListItem>
    );
};

export const CatalogsPage = CreatePage(HeaderNavigation, CatalogsPageBody);
