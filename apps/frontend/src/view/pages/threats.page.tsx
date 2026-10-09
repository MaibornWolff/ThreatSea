import Visibility from "@mui/icons-material/Visibility";
import UnfoldMore from "@mui/icons-material/UnfoldMore";
import UnfoldLess from "@mui/icons-material/UnfoldLess";
import FilterAltOff from "@mui/icons-material/FilterAltOff";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    IconButton,
    LinearProgress,
    Menu,
    MenuItem,
    Tooltip,
    Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { GridColumnVisibilityModel, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import { memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useParams } from "react-router";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { useColumnFilters } from "#application/hooks/use-column-filters.hook.ts";
import { getToggleableColumns, useColumnVisibility } from "#application/hooks/use-column-visibility.hook.ts";
import { applyColumnWidths, useColumnWidths } from "#application/hooks/use-column-widths.hook.ts";
import { useEditor } from "#application/hooks/use-editor.hook.ts";
import { useLoadThreatsOnce } from "#application/hooks/use-load-threats-once.hook.ts";
import { useThreatActions } from "#application/hooks/use-threat-actions.hook.ts";
import { useGenericThreatsList } from "#application/hooks/use-generic-threats-list.hook.ts";
import { Page } from "#view/components/page.component.tsx";
import { CreatePage } from "#view/components/create-page.component.tsx";
import { usePageTitle } from "#application/hooks/use-page-title.hook.ts";
import { HeaderUtilityControls } from "#view/components/header-utility-controls.component.tsx";
import ThreatDialogPage from "./threat-dialog.page";
import { MeasureImpactByMeasureDialogPage } from "./measure-impact-by-measure-dialog.page";
import AddMeasureDialogPage from "./add-measure-dialog.page";
import { withProject } from "#view/components/with-project.hoc.tsx";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { createThreatsColumns } from "./create-threats-columns";
import { buildThreatsRows, isThreatOnlySortField, type ThreatsSort, type ThreatsSortField } from "./build-threats-rows";
import { ThreatsGrid } from "./threats-grid.component";
import { ThreatAssetsPopper } from "./threat-assets-popper.component";

/**
 * on this page all threats are listed
 * @component
 * @category Pages
 */
const DEFAULT_COLUMN_VISIBILITY: GridColumnVisibilityModel = {
    name: true,
    // Descriptions are long free text; the column is opt-in via Customize view.
    description: false,
    assets: true,
    componentName: true,
    pointOfAttack: true,
    attacker: true,
    probability: true,
    damage: true,
    risk: true,
    status: true,
    actions: true,
};

const ThreatsPageBody = () => {
    const { projectId: projectIdParam = "0" } = useParams<{ projectId?: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { t } = useTranslation("threatsPage");
    usePageTitle(t("threats"));
    const theme = useTheme();

    const { autoSaveStatus } = useEditor({ projectId: projectId });

    const {
        loadGenericThreats,
        isPending: isGenericThreatsPending,
        genericThreats,
        expandedGenericThreatIds,
        threatsByGenericThreatId,
        toggleGenericThreat,
        setAllGenericThreatsExpanded,
    } = useGenericThreatsList({ projectId });

    const userRole = useAppSelector((state) => state.projects.current?.role);

    const dispatch = useAppDispatch();

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

    useLoadThreatsOnce({ projectId, autoSaveStatus, load: loadGenericThreats });

    const [assetAnchorEl, setAssetAnchorEl] = useState<HTMLElement | null>(null);
    const [currentAssetList, setCurrentAssetList] = useState<ExtendedThreat["assets"] | null>(null);

    const handleAssetHover = useCallback(
        (event: React.SyntheticEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => {
            setCurrentAssetList(assets);
            setAssetAnchorEl(event.currentTarget);
        },
        []
    );

    const handleAssetHoverEnd = useCallback(() => {
        setAssetAnchorEl(null);
    }, []);

    const { onClickEditThreat, handleAddThreat, handleDuplicateThreat, handleDeleteThreat } = useThreatActions({
        projectId,
        threatsByGenericThreatId,
        expandedGenericThreatIds,
        toggleGenericThreat,
        loadGenericThreats,
    });

    const { columnVisibility, toggleColumnVisibility } = useColumnVisibility(
        `threats-column-visibility-${projectId}`,
        DEFAULT_COLUMN_VISIBILITY
    );
    const { columnWidths, handleColumnWidthChange } = useColumnWidths(`threats-column-widths-${projectId}`);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);

    const columnLabels: Record<string, string> = {
        name: t("name"),
        description: t("description"),
        assets: t("assets"),
        componentName: t("componentName"),
        pointOfAttack: t("pointOfAttack"),
        attacker: t("attacker"),
        probability: t("probability"),
        damage: t("damage"),
        risk: t("risk"),
        status: t("status"),
        actions: t("actions"),
    };

    const {
        columnFilters,
        expandedFilters,
        hasActiveFilter,
        handleFilterChange,
        toggleFilterExpanded,
        clearColumnFilters,
    } = useColumnFilters();

    const allThreatsExpanded =
        genericThreats.length > 0 &&
        genericThreats.every((genericThreat) => expandedGenericThreatIds[genericThreat.id]);

    // Sorted by name by default, like the assets and measures tables; sorting and paging apply to
    // whole generic threats (see buildThreatsRows).
    const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "name", sort: "asc" }]);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
    const sort = useMemo<ThreatsSort>(
        () => ({
            field: (sortModel[0]?.field ?? "name") as ThreatsSortField,
            direction: sortModel[0]?.sort === "desc" ? "desc" : "asc",
        }),
        [sortModel]
    );

    const { rows, genericThreatCount } = useMemo(
        () =>
            buildThreatsRows({
                genericThreats,
                threatsByGenericThreatId,
                expandedGenericThreatIds,
                columnFilters,
                sort,
                page: paginationModel,
                t,
            }),
        [genericThreats, threatsByGenericThreatId, expandedGenericThreatIds, columnFilters, sort, paginationModel, t]
    );

    // Sorting by a column that only threat rows have values for expands every generic threat, so the
    // sorted values are visible. The grid itself returns to the first page on a new sort order, and to
    // the last remaining page when fewer generic threats are left.
    const handleSortModelChange = useCallback(
        (model: GridSortModel) => {
            setSortModel(model);
            const field = model[0]?.field;
            if (field !== undefined && isThreatOnlySortField(field)) {
                setAllGenericThreatsExpanded(true);
            }
        },
        [setAllGenericThreatsExpanded]
    );
    const handleColumnFilterChange = useCallback(
        (...args: Parameters<typeof handleFilterChange>) => {
            handleFilterChange(...args);
            setPaginationModel((previous) => ({ ...previous, page: 0 }));
        },
        [handleFilterChange]
    );
    const handleClearColumnFilters = useCallback(() => {
        clearColumnFilters();
        setPaginationModel((previous) => ({ ...previous, page: 0 }));
    }, [clearColumnFilters]);

    const columns = useMemo(
        () =>
            applyColumnWidths(
                createThreatsColumns({
                    t,
                    userRole,
                    columnFilters,
                    onFilterChange: handleColumnFilterChange,
                    expandedFilters,
                    onToggleFilterExpanded: toggleFilterExpanded,
                    onToggleGenericThreat: toggleGenericThreat,
                    onAssetHover: handleAssetHover,
                    onAssetHoverEnd: handleAssetHoverEnd,
                    onAddThreat: (event, genericThreat) => void handleAddThreat(event, genericThreat),
                    onEditThreat: onClickEditThreat,
                    onDuplicateThreat: handleDuplicateThreat,
                    onDeleteThreat: handleDeleteThreat,
                }),
                columnWidths
            ),
        [
            t,
            userRole,
            columnFilters,
            handleColumnFilterChange,
            expandedFilters,
            toggleFilterExpanded,
            toggleGenericThreat,
            handleAssetHover,
            handleAssetHoverEnd,
            handleAddThreat,
            onClickEditThreat,
            handleDuplicateThreat,
            handleDeleteThreat,
            columnWidths,
        ]
    );

    return (
        <Box sx={{ overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
            <LinearProgress
                sx={{
                    visibility: isGenericThreatsPending || autoSaveStatus === "saving" ? "visible" : "hidden",
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
                <ThreatAssetsPopper anchorEl={assetAnchorEl} assets={currentAssetList} />

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
                            marginBottom: 2,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Tooltip title={allThreatsExpanded ? t("collapseAllThreats") : t("expandAllThreats")}>
                                <IconButton
                                    onClick={() => setAllGenericThreatsExpanded(!allThreatsExpanded)}
                                    aria-label={allThreatsExpanded ? t("collapseAllThreats") : t("expandAllThreats")}
                                    data-testid="ToggleExpandAllThreats"
                                    sx={{ mr: 1, color: theme.vars.palette.text.primary }}
                                >
                                    {allThreatsExpanded ? (
                                        <UnfoldLess sx={{ fontSize: 20 }} />
                                    ) : (
                                        <UnfoldMore sx={{ fontSize: 20 }} />
                                    )}
                                </IconButton>
                            </Tooltip>
                            <Button
                                onClick={handleClick}
                                startIcon={<Visibility sx={{ fontSize: 18 }} />}
                                sx={{ ml: 2, textTransform: "none", color: theme.vars.palette.text.primary }}
                            >
                                {t("customizeView")}
                            </Button>
                            <Menu
                                anchorEl={anchorEl}
                                open={open}
                                onClose={handleClose}
                                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                                transformOrigin={{ vertical: "top", horizontal: "left" }}
                                slotProps={{
                                    list: {
                                        sx: { bgcolor: "background.mainIntransparent" },
                                    },
                                    paper: {
                                        sx: { borderRadius: 5 },
                                    },
                                }}
                            >
                                {getToggleableColumns(columnLabels, columns).map(([field, label]) => (
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
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {hasActiveFilter && (
                                <Button
                                    onClick={handleClearColumnFilters}
                                    startIcon={<FilterAltOff sx={{ fontSize: 18 }} />}
                                    data-testid="ClearThreatFilters"
                                    sx={{ mr: 2, textTransform: "none", color: theme.vars.palette.text.primary }}
                                >
                                    {t("clearFilters")}
                                </Button>
                            )}
                            {(genericThreatCount > 0 || hasActiveFilter) && (
                                <>
                                    <Typography sx={{ mr: 0.5, fontWeight: "bold", color: "primary.text" }}>
                                        {genericThreatCount}
                                    </Typography>
                                    <Typography>{t("threatsFound")}</Typography>
                                </>
                            )}
                        </Box>
                    </Box>

                    <ThreatsGrid
                        rows={rows}
                        columns={columns}
                        loading={isGenericThreatsPending}
                        columnVisibilityModel={columnVisibility}
                        sortModel={sortModel}
                        onSortModelChange={handleSortModelChange}
                        paginationModel={paginationModel}
                        onPaginationModelChange={setPaginationModel}
                        genericThreatCount={genericThreatCount}
                        onColumnWidthChange={handleColumnWidthChange}
                        onToggleGenericThreat={toggleGenericThreat}
                        onEditThreat={onClickEditThreat}
                    />
                </Box>

                <Routes>
                    <Route path="edit" element={<ThreatDialogPage onSaved={() => void loadGenericThreats()} />} />
                    <Route
                        path="measureImpacts/edit"
                        element={<MeasureImpactByMeasureDialogPage onApplied={() => void loadGenericThreats()} />}
                    >
                        <Route path="measures/add" element={<AddMeasureDialogPage />} />
                    </Route>
                </Routes>
            </Page>
        </Box>
    );
};

export const ThreatsPage = memo(CreatePage(HeaderUtilityControls, withProject(ThreatsPageBody), true));
ThreatsPage.displayName = "ThreatsPage";
