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
    Popper,
    Tooltip,
    Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { GridColumnVisibilityModel } from "@mui/x-data-grid";
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
import { createThreatsColumns, type ThreatsGridRow } from "./create-threats-columns";
import { buildThreatsRows } from "./build-threats-rows";
import { ThreatsGrid } from "./threats-grid.component";

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

    const { columnFilters, expandedFilters, handleFilterChange, toggleFilterExpanded, clearColumnFilters } =
        useColumnFilters();

    const hasActiveFilter = Object.values(columnFilters).some((value) => value.trim() !== "");

    const allThreatsExpanded =
        genericThreats.length > 0 &&
        genericThreats.every((genericThreat) => expandedGenericThreatIds[genericThreat.id]);

    const rows = useMemo<ThreatsGridRow[]>(
        () =>
            buildThreatsRows({
                genericThreats,
                threatsByGenericThreatId,
                expandedGenericThreatIds,
                columnFilters,
                t,
            }),
        [genericThreats, threatsByGenericThreatId, expandedGenericThreatIds, columnFilters, t]
    );

    const columns = useMemo(
        () =>
            applyColumnWidths(
                createThreatsColumns({
                    t,
                    userRole,
                    columnFilters,
                    onFilterChange: handleFilterChange,
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
            handleFilterChange,
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

    // Count what the grid actually shows: the generic threats surviving the
    // column filters (not the unfiltered hook result).
    const genericThreatsCount = useMemo(() => rows.filter((row) => row.rowType === "genericThreat").length, [rows]);

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
                <Popper
                    open={assetAnchorEl != null}
                    anchorEl={assetAnchorEl}
                    placement="bottom-start"
                    sx={{
                        backgroundColor: "background.defaultIntransparent",
                        borderRadius: 5,
                        boxShadow: 1,
                    }}
                >
                    <ul
                        style={{
                            listStyleType: "none",
                            textAlign: "left",
                            padding: 8,
                            margin: 4,
                        }}
                    >
                        {currentAssetList?.map((asset) => (
                            <li key={asset.id}>
                                {asset.name +
                                    " (C " +
                                    asset.confidentiality +
                                    " / I " +
                                    asset.integrity +
                                    " / A " +
                                    asset.availability +
                                    ")"}
                            </li>
                        ))}
                    </ul>
                </Popper>

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
                                    onClick={clearColumnFilters}
                                    startIcon={<FilterAltOff sx={{ fontSize: 18 }} />}
                                    data-testid="ClearThreatFilters"
                                    sx={{ mr: 2, textTransform: "none", color: theme.vars.palette.text.primary }}
                                >
                                    {t("clearFilters")}
                                </Button>
                            )}
                            {(genericThreatsCount > 0 || hasActiveFilter) && (
                                <>
                                    <Typography sx={{ mr: 0.5, fontWeight: "bold", color: "primary.text" }}>
                                        {genericThreatsCount}
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
