/**
 * @module asset.page - Defines the asset
 *     page in the projects.
 */

import { Add, Delete } from "@mui/icons-material";
import { LinearProgress, Typography } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Box } from "@mui/system";
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useNavigate } from "react-router-dom";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useAssetsList } from "../../application/hooks/use-assets-list.hook";
import { IconButton } from "../components/icon-button.component";
import { Page } from "../components/page.component";
import { SearchField } from "../components/search-field.component";
import CustomTableHeaderCell from "../components/table-header.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import { withProject } from "../components/with-project.hoc";
import AssetDialogPage from "./asset-dialog.page";
import { useConfirm } from "../../application/hooks/use-confirm.hook";

/**
 * Creates the asset page under a project.
 *
 * @param {object} history - History object.
 * @param {object} project - The current projects data.
 * @param {string} projectId - The id of the current project.
 * @returns Asset page to add, list assets and more.
 */
const AssetsPageBody = ({ project }) => {
    const projectId = parseInt(project.id);
    const dispatch = useDispatch();
    const {
        t,
        i18n: { language },
    } = useTranslation("assetsPage");

    const { setSortDirection, setSearchValue, setSortBy, deleteAsset, sortDirection, sortBy, isPending, assets } =
        useAssetsList({
            projectId,
        });

    const userRole = useSelector((state) => state.projects.current.role);
    const { openConfirm } = useConfirm();

    const navigate = useNavigate();

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: true,
                showUniversalHeaderNavigation: true,
                showProjectInfo: true,
                getCatalogInfo: false,
            })
        );
    });

    /**
     * Changes the search filter of the list view.
     * @event Box#onChange
     * @param {SyntheticBaseEvent} e - Event of the change.
     */
    const onChangeSearchValue = (e) => {
        setSearchValue(e.target.value);
    };

    /**
     * Changes the attribute to sort the assets page by.
     *
     * @event CustomTableHeaderCell#onClick
     * @param {SyntheticBaseEvent} e - Onclick event.
     * @param {string} newSortBy - The new attribute to sortby.
     */
    const onChangeSortBy = (e, newSortBy) => {
        // If the attribute is clicked again, the order is changed.
        if (sortBy === newSortBy) {
            const newSortDirection = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? "asc" : null;
            if (newSortDirection) {
                setSortDirection(newSortDirection);
            }
        } else if (newSortBy) {
            setSortBy(newSortBy);
        }
    };

    /**
     * Opens the add asset dialog.
     * @event IconButton#onClick
     */
    const onClickAddAssets = () => {
        navigate(`/projects/${projectId}/assets/edit`, {
            state: { project },
        });
    };

    /**
     * Opens the dialog to edit an asset when it's clicked on.
     *
     * @event Tabelbody#onEdit
     * @param {SyntheticBaseEvent} e - Onclick event.
     * @param {object} asset - Data of the asset.
     */
    const onClickEditAsset = (e, asset) => {
        if (!e.isDefaultPrevented()) {
            e.preventDefault();
            navigate(`/projects/${projectId}/assets/edit`, {
                state: {
                    project,
                    asset,
                },
            });
        }
    };

    /**
     * Deletes an asset after confirm
     * after confirm
     * @event Tabelbody#onEdit
     * @param {SyntheticBaseEvent} e - Event of the click.
     * @param {object} asset - Data of the asset.
     */
    const onClickDeleteAsset = (e, asset) => {
        e.preventDefault();
        openConfirm({
            state: asset,
            message: t("assetDeleteMessage", { name: asset.name }),
            cancelText: t("cancelBtn"),
            acceptText: t("deleteBtn"),
            onAccept: (asset) => {
                deleteAsset(asset);
            },
        });
    };

    const handleAssetsCount = () => {
        if (assets.length > 1) return t("assetsFound");
        return t("assetFound");
    };

    return (
        <Box sx={{ overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
            {
                <LinearProgress
                    sx={{
                        visibility: isPending ? "visible" : "hidden",
                        boxSizing: "border-box",
                    }}
                />
            }
            <Page
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    height: "100%",
                    paddingTop: 5,
                    paddingBottom: 4,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "background.paperIntransparent",
                        boxShadow: 1,
                        padding: 4,
                        boxSizing: "border-box",
                        borderRadius: 5,
                        height: "100%",
                    }}
                >
                    <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        paddingTop={1}
                        paddingBottom={2}
                    >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <SearchField onChange={onChangeSearchValue} data-testid="SearchAsset" />
                            {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                <IconButton
                                    title={t("addAsset")}
                                    sx={{
                                        ml: 1,
                                        color: "text.primary",
                                    }}
                                    onClick={onClickAddAssets}
                                    data-testid="assets-page_add-asset-button"
                                >
                                    <Add sx={{ fontSize: 18 }} />
                                </IconButton>
                            )}
                        </Box>
                        <Box display="flex" alignItems="center">
                            {assets.length > 0 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            mr: 0.5,
                                            fontWeight: "bold",
                                            color: "primary.text",
                                        }}
                                    >
                                        {assets.length}
                                    </Typography>
                                    <Typography>{handleAssetsCount()}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            borderRadius: 5,
                            boxShadow: 1,
                            boxSizing: "border-box",
                            overflowX: "hidden",
                            height: "100%",
                        }}
                    >
                        <Box
                            sx={{
                                borderRadius: 5,
                                height: "100%",
                            }}
                        >
                            <TableContainer
                                sx={{
                                    height: "100%",
                                    overflowY: "auto",
                                    boxSizing: "border-box",
                                    width: "100%",
                                    "::-webkit-scrollbar-track": {
                                        borderTopLeftRadius: 0,
                                        borderBottomLeftRadius: 0,
                                        borderBottomRightRadius: 500,
                                        borderTopRightRadius: 500,
                                    },
                                }}
                            >
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <CustomTableHeaderCell
                                                name="name"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={false}
                                                onClick={onChangeSortBy}
                                                data-testid="assets-page_sort-assets-by-name-button"
                                            >
                                                {t("name")}
                                            </CustomTableHeaderCell>

                                            <CustomTableHeaderCell
                                                name="confidentiality"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={false}
                                                onClick={onChangeSortBy}
                                                data-testid="assets-page_sort-assets-by-confidentiality-button"
                                            >
                                                {t("confidentiality")}
                                            </CustomTableHeaderCell>

                                            <CustomTableHeaderCell
                                                name="integrity"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={false}
                                                onClick={onChangeSortBy}
                                                data-testid="assets-page_sort-assets-by-integrity-button"
                                            >
                                                {t("integrity")}
                                            </CustomTableHeaderCell>

                                            <CustomTableHeaderCell
                                                name="availability"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={false}
                                                onClick={onChangeSortBy}
                                                data-testid="assets-page_sort-assets-by-availability-button"
                                            >
                                                {t("availability")}
                                            </CustomTableHeaderCell>

                                            <CustomTableHeaderCell
                                                name="createdAt"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                showBorder={false}
                                                onClick={onChangeSortBy}
                                                data-testid="assets-page_sort-assets-by-date-button"
                                            >
                                                {t("creationDate")}
                                            </CustomTableHeaderCell>

                                            <CustomTableHeaderCell></CustomTableHeaderCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isPending && (
                                            <Typography
                                                sx={{
                                                    paddingTop: 2,
                                                    paddingLeft: 2,
                                                    fontSize: "0.75rem",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {t("assetsLoading")}
                                            </Typography>
                                        )}
                                        {assets.length === 0 && !isPending && (
                                            <Typography
                                                sx={{
                                                    paddingTop: 2,
                                                    paddingLeft: 2,
                                                    fontSize: "0.75rem",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {t("noAssetsFound")}
                                            </Typography>
                                        )}
                                        {!isPending &&
                                            assets.map((asset, i) => {
                                                return (
                                                    <AssetTableRow
                                                        key={i}
                                                        language={language}
                                                        asset={asset}
                                                        onEdit={onClickEditAsset}
                                                        onDelete={onClickDeleteAsset}
                                                        userRole={userRole}
                                                    />
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
                </Box>
                {
                    <Routes>
                        <Route path="edit" element={<AssetDialogPage />} />
                    </Routes>
                }
            </Page>
        </Box>
    );
};

/**
 * Creates a row for the asset list view.
 *
 * @param {object} asset - The data of the asset.
 * @param {function} onEdit - Function that handles the editing of an asset.
 * @param {function} onDelete - Function that handles the deletion of an asset.
 * @param {string} language - Language specification string.
 * @param userRole - privilege of the Use in the Project
 * @returns React component for creating a row for an asset.
 */
const AssetTableRow = ({ asset, onEdit, onDelete, language, userRole }) => {
    const { createdAt, name, confidentiality, integrity, availability } = asset;
    const assetCreationDate = new Date(createdAt);

    const { t } = useTranslation("assetsPage");
    return (
        <TableRow
            sx={{
                backgroundColor: "background.mainIntransparent",
                borderRadius: 5,
                marginBottom: 1,

                "&:last-child td, &:last-child th": { border: 0 },
                "&:hover": {
                    cursor: "pointer",
                    backgroundColor: "#ffffff !important",
                },
            }}
            onClick={(e) => onEdit(e, asset)}
            hover
            data-testid="assets-page_assets-list-entry"
        >
            <TableCell
                scope="row"
                sx={{
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                    borderBottomColor: "#fff",
                }}
                data-testid="assets-page_assets-list-entry_name"
            >
                {name}
            </TableCell>

            <TableCell
                align="center"
                sx={{
                    borderBottomColor: "#fff",
                    fontSize: "0.875rem",
                }}
                data-testid="assets-page_assets-list-entry_confidentiality"
            >
                {confidentiality}
            </TableCell>

            <TableCell
                align="center"
                sx={{
                    borderBottomColor: "#fff",
                    fontSize: "0.875rem",
                }}
                data-testid="assets-page_assets-list-entry_integrity"
            >
                {integrity}
            </TableCell>

            <TableCell
                align="center"
                sx={{
                    borderBottomColor: "#fff",
                    fontSize: "0.875rem",
                }}
                data-testid="assets-page_assets-list-entry_availability"
            >
                {availability}
            </TableCell>

            <TableCell
                align="center"
                sx={{
                    borderBottomColor: "#fff",
                    fontSize: "0.875rem",
                }}
                data-testid="assets-page_assets-list-entry_date"
            >
                {assetCreationDate.toISOString().split("T")[0]}
            </TableCell>
            <TableCell
                align="right"
                data-testid="DeleteAsset"
                sx={{
                    padding: 0,
                    paddingRight: 2,
                    borderBottomColor: "#fff",
                }}
            >
                {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                    <IconButton
                        title={t("deleteAsset")}
                        hoverColor="error"
                        sx={{
                            color: "text.primary",
                        }}
                        onClick={(e) => onDelete(e, asset)}
                        data-testid="assets-page_assets-list-entry_delete-button"
                    >
                        <Delete sx={{ fontSize: 18 }} />
                    </IconButton>
                )}
            </TableCell>
        </TableRow>
    );
};

export const AssetsPage = CreatePage(HeaderNavigation, withProject(AssetsPageBody), true);
