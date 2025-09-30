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
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { Route, Routes } from "react-router-dom";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useCatalogsList } from "../../application/hooks/use-catalogs-list.hook";
import { useCatalogs } from "../../application/hooks/use-catalogs.hook";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { IconButton } from "../components/icon-button.component";
import { PageHeading } from "../components/page-heading.component";
import { Page } from "../components/page.component";
import { SearchField } from "../components/search-field.component";
import { ToggleButtons } from "../components/toggle-buttons.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import CatalogDialogPage from "./catalog-dialog.page";
import { useUser } from "../../application/hooks/use-user.hook";

/**
 * Creates a page for a listing of all catalogues threatsea has defined.
 *
 * @returns The Catalogues page.
 */
const CatalogsPageBody = () => {
    const { openConfirm } = useConfirm();
    const navigate = useNavigate();
    const {
        t,
        i18n: { language },
    } = useTranslation("catalogsPage");

    const { setSortDirection, setSearchValue, setSortBy, isPending, sortDirection, sortBy, catalogs } =
        useCatalogsList();

    const { isPrivileged } = useUser();

    const { deleteCatalog } = useCatalogs();

    const dispatch = useDispatch();

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
    const onClickAddCatalog = (e) => {
        onClickEditCatalog(e, null);
    };

    /**
     * Changes the search value of the catalogues.
     *
     * @event SearchField#onChange
     * @param {SyntheticBaseEvent} e - OnChange event.
     */
    const onChangeSearchValue = (e) => {
        setSearchValue(e.target.value);
    };

    /**
     * Sets the attribute to sort the catalogues by.
     *
     * @event ToggleButtons#onChange
     * @param {SyntheticBaseEvent} e - Onchange event.
     * @param {string} sortBy - The string attribute to sort by.
     */
    const onChangeSortBy = (e, sortBy) => {
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
    const onChangeSortDirection = (e, sortDirection) => {
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
    const onClickOpenCatalog = (e, catalog) => {
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
    const onClickEditCatalog = (e, catalog) => {
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
    const onClickDeleteCatalog = (e, catalog) => {
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
                <PageHeading></PageHeading>
                <Box display="flex" alignItems="center" justifyContent="space-between" paddingTop={1} paddingBottom={2}>
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
                    <Box display="flex" alignItems="center" marginRight={4}>
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
const CatalogListItem = ({ catalog, onClick, onClickEdit, onClickDelete, ...props }) => {
    const { name, language } = catalog;
    const { t } = useTranslation("catalogsPage");

    return (
        <ListItem
            button
            divider
            component={Box}
            onClick={(e) => onClick(e, catalog)}
            sx={{
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
                        <Typography sx={{ textTransform: "uppercase", marginLeft: "0.25rem" }} variant="span">
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
