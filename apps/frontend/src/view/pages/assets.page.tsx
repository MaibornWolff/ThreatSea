/**
 * @module asset.page - Defines the asset
 *     page in the projects.
 */

import { Add, Visibility } from "@mui/icons-material";
import { Box, Button, Checkbox, FormControlLabel, LinearProgress, Menu, MenuItem, Typography } from "@mui/material";
import { DataGrid, type GridColumnVisibilityModel, type GridFilterModel } from "@mui/x-data-grid";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate } from "react-router-dom";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { Asset } from "#api/types/asset.types.ts";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useAssetsList } from "../../application/hooks/use-assets-list.hook";
import { IconButton } from "../components/icon-button.component";
import { Page } from "../components/page.component";
import { CreatePage } from "../components/create-page.component";
import { HeaderUtilityControls } from "../components/header-utility-controls.component";
import { withProject } from "../components/with-project.hoc";
import AssetDialogPage from "./asset-dialog.page";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { createAssetsColumns } from "./assets.columns";

interface AssetsPageBodyProps {
    project: ExtendedProject;
}

const NoRowsOverlay = ({ message }: { message: string }) => (
    <Box
        sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        }}
    >
        <Typography sx={{ fontSize: "0.75rem", fontStyle: "italic" }}>{message}</Typography>
    </Box>
);

const AssetsPageBody = ({ project }: AssetsPageBodyProps) => {
    const projectId = project.id;
    const dispatch = useAppDispatch();
    const { t } = useTranslation("assetsPage");
    const { t: tCommon } = useTranslation("common");

    const { deleteAsset, isPending, assets } = useAssetsList({ projectId });

    const userRole = useAppSelector((state) => state.projects.current?.role);
    const { openConfirm } = useConfirm<Asset>();
    const navigate = useNavigate();

    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: true,
                showUniversalHeaderNavigation: true,
                showProjectInfo: true,
                getCatalogInfo: false,
            })
        );
    }, [dispatch]);

    const SESSION_STORAGE_KEY = `assets-column-visibility-${projectId}`;

    const getInitialColumnVisibility = (): GridColumnVisibilityModel => {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                // Fall through to default
            }
        }
        return {
            name: true,
            confidentiality: true,
            integrity: true,
            availability: true,
            createdAt: true,
            actions: true,
        };
    };

    const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>(getInitialColumnVisibility);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const toggleColumnVisibility = (field: string) => {
        setColumnVisibility((prev) => {
            const newVisibility = { ...prev, [field]: !prev[field] };
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newVisibility));
            return newVisibility;
        });
    };

    const columnLabels: Record<string, string> = {
        name: tCommon("name"),
        confidentiality: tCommon("confidentiality"),
        integrity: tCommon("integrity"),
        availability: tCommon("availability"),
        createdAt: tCommon("creationDate"),
        actions: t("actions"),
    };

    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

    const handleFilterChange = useCallback((field: string, value: string) => {
        setColumnFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleFilterExpanded = useCallback((field: string) => {
        setExpandedFilters((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const filterModel: GridFilterModel = useMemo(
        () => ({
            items: Object.entries(columnFilters)
                .filter(([_, value]) => value.trim() !== "")
                .map(([field, value]) => ({
                    field,
                    operator: "contains",
                    value,
                })),
        }),
        [columnFilters]
    );

    const onClickAddAssets = () => {
        navigate(`/projects/${projectId}/assets/edit`, { state: { project } });
    };

    const onClickEditAsset = (asset: Asset) => {
        navigate(`/projects/${projectId}/assets/edit`, {
            state: { project, asset },
        });
    };

    const handleDeleteAsset = useCallback(
        (asset: Asset) => {
            openConfirm({
                state: asset,
                message: t("assetDeleteMessage", { name: asset.name }),
                cancelText: t("cancelBtn"),
                acceptText: t("deleteBtn"),
                onAccept: (asset) => {
                    deleteAsset(asset);
                },
            });
        },
        [openConfirm, t, deleteAsset]
    );

    const NoRowsOverlayWithMessage = useCallback(() => <NoRowsOverlay message={t("noAssetsFound")} />, [t]);

    const columns = useMemo(
        () =>
            createAssetsColumns({
                t,
                userRole,
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded,
                handleDeleteAsset,
            }),
        [t, userRole, columnFilters, handleFilterChange, expandedFilters, toggleFilterExpanded, handleDeleteAsset]
    );

    const handleAssetsCount = (): string => {
        if (assets.length > 1) {
            return t("assetsFound");
        }
        return t("assetFound");
    };

    return (
        <Box sx={{ overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
            <LinearProgress
                sx={{
                    visibility: isPending ? "visible" : "hidden",
                    boxSizing: "border-box",
                }}
            />
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
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 1,
                            paddingBottom: 2,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Button
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={handleClick}
                                sx={{ textTransform: "none" }}
                            >
                                {t("customizeView")}
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                                transformOrigin={{ vertical: "top", horizontal: "left" }}
                            >
                                {Object.entries(columnLabels).map(([field, label]) => (
                                    <MenuItem
                                        key={field}
                                        onClick={() => toggleColumnVisibility(field)}
                                        sx={{ py: 0.5 }}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Checkbox checked={columnVisibility[field] !== false} size="small" />
                                            }
                                            label={label}
                                            sx={{ m: 0, width: "100%", pointerEvents: "none" }}
                                        />
                                    </MenuItem>
                                ))}
                            </Menu>
                            {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                <IconButton
                                    title={t("addAsset")}
                                    sx={{ ml: 1, color: "text.primary" }}
                                    onClick={onClickAddAssets}
                                    data-testid="assets-page_add-asset-button"
                                >
                                    <Add sx={{ fontSize: 18 }} />
                                </IconButton>
                            )}
                        </Box>
                        {assets.length > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography sx={{ mr: 0.5, fontWeight: "bold", color: "primary.text" }}>
                                    {assets.length}
                                </Typography>
                                <Typography>{handleAssetsCount()}</Typography>
                            </Box>
                        )}
                    </Box>

                    <DataGrid
                        rows={assets}
                        columns={columns}
                        loading={isPending}
                        disableRowSelectionOnClick
                        disableColumnFilter
                        disableColumnMenu
                        disableColumnSelector
                        filterModel={filterModel}
                        onCellClick={(params) => {
                            if (params.field !== "actions") {
                                onClickEditAsset(params.row);
                            }
                        }}
                        columnHeaderHeight={90}
                        columnVisibilityModel={columnVisibility}
                        sx={{
                            borderRadius: 5,
                            boxShadow: 1,
                            "& .MuiDataGrid-row": { cursor: "pointer" },
                            "& .MuiDataGrid-cell:focus": { outline: "none" },
                            "& .MuiDataGrid-columnHeader:focus": { outline: "none" },
                            "& .MuiDataGrid-columnHeader": { padding: "8px 16px" },
                            "& .MuiDataGrid-cell": { cursor: "pointer" },
                        }}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25, page: 0 } },
                        }}
                        pageSizeOptions={[10, 25, 50, 100]}
                        slots={{ noRowsOverlay: NoRowsOverlayWithMessage }}
                    />
                </Box>
                <Routes>
                    <Route path="edit" element={<AssetDialogPage />} />
                </Routes>
            </Page>
        </Box>
    );
};

export const AssetsPage = CreatePage(HeaderUtilityControls, withProject(AssetsPageBody), true);
