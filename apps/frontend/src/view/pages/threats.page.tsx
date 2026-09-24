import {
    Box,
    LinearProgress,
    Popper,
    Typography,
    Button,
    Menu,
    MenuItem,
    Checkbox,
    FormControlLabel,
} from "@mui/material";
import { DataGrid, GridRow, type GridColumnVisibilityModel, type GridRowProps } from "@mui/x-data-grid";
import Visibility from "@mui/icons-material/Visibility";
import { memo, useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { useEditor } from "#application/hooks/use-editor.hook.ts";
import { useLoadThreatsOnce } from "#application/hooks/use-load-threats-once.hook.ts";
import { useThreatsList, type ThreatListItem } from "#application/hooks/use-threats-list.hook.ts";
import { useColumnFilters } from "#application/hooks/use-column-filters.hook.ts";
import { useColumnVisibility } from "#application/hooks/use-column-visibility.hook.ts";
import { applyColumnWidths, useColumnWidths } from "#application/hooks/use-column-widths.hook.ts";
import { applyColumnFilters } from "#utils/column-filters.ts";

const ThreatsGridRowSlot = (props: GridRowProps) => (
    <GridRow {...props} data-testid="threats-page_threats-list-entry" />
);

const DEFAULT_COLUMN_VISIBILITY: GridColumnVisibilityModel = {
    name: true,
    assets: true,
    componentName: true,
    pointOfAttack: true,
    attacker: true,
    probability: true,
    damage: true,
    risk: true,
    doneEditing: true,
    actions: true,
};
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { NoRowsOverlay } from "#view/components/no-rows-overlay.component.tsx";
import { Page } from "#view/components/page.component.tsx";
import { CreatePage } from "#view/components/create-page.component.tsx";
import { usePageTitle } from "#application/hooks/use-page-title.hook.ts";
import { HeaderUtilityControls } from "#view/components/header-utility-controls.component.tsx";
import { withProject } from "#view/components/with-project.hoc.tsx";
import ThreatDialogPage from "./threat-dialog.page";
import { MeasureImpactByMeasureDialogPage } from "./measure-impact-by-measure-dialog.page";
import AddMeasureDialogPage from "./add-measure-dialog.page";
import { createThreatsColumns } from "./create-threats-columns";

/**
 * on this page all threats are listed
 * @component
 * @category Pages
 */
const ThreatsPageBody = () => {
    const { projectId: projectIdParam = "0" } = useParams<{ projectId?: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { openConfirm } = useConfirm<ExtendedThreat>();
    const navigate = useNavigate();
    const { t } = useTranslation("threatsPage");
    usePageTitle(t("threats"));

    const NoRowsOverlayWithMessage = useCallback(() => <NoRowsOverlay message={t("noThreatsFound")} />, [t]);

    const { duplicateThreat, deleteThreat, loadThreats, isPending, threats } = useThreatsList({ projectId: projectId });

    const { autoSaveStatus } = useEditor({ projectId: projectId });

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

    const { columnVisibility, toggleColumnVisibility } = useColumnVisibility(
        `threats-column-visibility-${projectId}`,
        DEFAULT_COLUMN_VISIBILITY
    );
    const { columnWidths, handleColumnWidthChange } = useColumnWidths(`threats-column-widths-${projectId}`);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const columnLabels: Record<string, string> = {
        name: t("name"),
        assets: t("assets"),
        componentName: t("componentName"),
        pointOfAttack: t("pointOfAttack"),
        attacker: t("attacker"),
        probability: t("probability"),
        damage: t("damage"),
        risk: t("risk"),
        doneEditing: t("edited"),
        actions: t("actions"),
    };

    const onClickEditThreat = (threat: ThreatListItem) => {
        navigate(`/projects/${projectId}/threats/edit`, {
            state: { threat },
        });
    };

    const handleDuplicateThreat = useCallback(
        (threat: ThreatListItem) => {
            openConfirm({
                state: threat,
                message: t("duplicateMessage", { threatName: threat.name }),
                acceptText: t("duplicate"),
                cancelText: t("cancel"),
                acceptColor: "secondary",
                onAccept: (threat) => {
                    duplicateThreat(threat);
                },
            });
        },
        [openConfirm, t, duplicateThreat]
    );

    const handleDeleteThreat = useCallback(
        (threat: ThreatListItem) => {
            openConfirm({
                state: threat,
                message: t("deleteMessage", { threatName: threat.name }),
                acceptText: t("delete"),
                cancelText: t("cancel"),
                onAccept: (threat) => {
                    deleteThreat(threat);
                },
            });
        },
        [openConfirm, t, deleteThreat]
    );

    useLoadThreatsOnce({ projectId, autoSaveStatus, load: loadThreats });

    const [assetAnchorEl, setAssetAnchorEl] = useState<HTMLElement | null>(null);
    const [currentAssetList, setCurrentAssetList] = useState<ExtendedThreat["assets"] | null>(null);
    const { columnFilters, expandedFilters, handleFilterChange, toggleFilterExpanded } = useColumnFilters();

    /**
     * Make the Popper show the asset list for the threat the mouse is over
     */
    const handleAssetHover = (event: React.MouseEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => {
        setCurrentAssetList(assets);
        setAssetAnchorEl(event.currentTarget);
    };

    // Filtered in JS: the community DataGrid applies at most one controlled
    // filter-model item, which silently breaks combined column filters. The value
    // getters mirror each column's displayed text.
    const filteredThreats = useMemo(
        () =>
            applyColumnFilters(
                threats,
                columnFilters,
                {
                    assets: (threat) => String(threat.assets.length),
                    componentName: (threat) =>
                        threat.pointOfAttack === "COMMUNICATION_INTERFACES"
                            ? `${threat.componentName || t("unknown")} > ${threat.interfaceName}`
                            : (threat.componentName ?? ""),
                    pointOfAttack: (threat) => t(`pointsOfAttackList.${threat.pointOfAttack}`),
                    attacker: (threat) => t(`attackerList.${threat.attacker}`),
                },
                {
                    // The header select stores "edited"/"notEdited"; a contains match cannot
                    // separate them ("notedited" contains "edited"), so match exactly.
                    doneEditing: (threat, filterValue) => (threat.doneEditing ? "edited" : "notedited") === filterValue,
                }
            ),
        [threats, columnFilters, t]
    );

    const columns = useMemo(
        () =>
            applyColumnWidths(
                createThreatsColumns({
                    t,
                    userRole,
                    columnFilters,
                    handleFilterChange,
                    handleAssetHover,
                    setAssetAnchorEl,
                    handleDuplicateThreat,
                    handleDeleteThreat,
                    expandedFilters,
                    toggleFilterExpanded,
                }),
                columnWidths
            ),
        [
            t,
            userRole,
            columnFilters,
            handleFilterChange,
            handleDuplicateThreat,
            handleDeleteThreat,
            expandedFilters,
            toggleFilterExpanded,
            columnWidths,
        ]
    );

    return (
        <Box sx={{ overflow: "hidden", height: "100%", boxSizing: "border-box" }}>
            {
                <LinearProgress
                    sx={{
                        visibility: isPending || autoSaveStatus === "saving" ? "visible" : "hidden",
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
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "left",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "left",
                                }}
                                slotProps={{
                                    list: {
                                        sx: { bgcolor: "background.mainIntransparent" },
                                    },
                                    paper: {
                                        sx: { borderRadius: 5 },
                                    },
                                }}
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
                        </Box>
                        {threats.length > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography
                                    sx={{
                                        mr: 0.5,
                                        fontWeight: "bold",
                                        color: "primary.text",
                                    }}
                                >
                                    {filteredThreats.length}
                                </Typography>
                                <Typography>{t("threatsFound")}</Typography>
                            </Box>
                        )}
                    </Box>

                    <DataGrid
                        rows={filteredThreats}
                        columns={columns}
                        loading={isPending}
                        disableRowSelectionOnClick
                        disableColumnFilter
                        disableColumnMenu
                        disableColumnSelector
                        onCellClick={(params) => {
                            if (params.field !== "actions") {
                                onClickEditThreat(params.row);
                            }
                        }}
                        onCellKeyDown={(params, event) => {
                            // Keyboard equivalent of the cell click; skip events coming from
                            // interactive elements inside a cell (they handle Enter natively).
                            if (event.key !== "Enter" && event.key !== " ") {
                                return;
                            }
                            if ((event.target as HTMLElement).closest("button, a, input")) {
                                return;
                            }
                            if (params.field !== "actions") {
                                event.preventDefault();
                                onClickEditThreat(params.row);
                            }
                        }}
                        getRowClassName={(params) => (params.row.doneEditing ? "row-done-editing" : "")}
                        columnHeaderHeight={90}
                        columnVisibilityModel={columnVisibility}
                        onColumnWidthChange={handleColumnWidthChange}
                        sx={{
                            borderRadius: 5,
                            boxShadow: 1,
                            "& .MuiDataGrid-row": {
                                cursor: "pointer",
                            },
                            "& .row-done-editing": {
                                opacity: 0.6,
                            },
                            "& .MuiDataGrid-cell:focus": {
                                outline: "none",
                            },
                            "& .MuiDataGrid-columnHeader:focus": {
                                outline: "none",
                            },
                            "& .MuiDataGrid-columnHeader": {
                                padding: "8px 16px",
                            },
                            "& .MuiDataGrid-cell": {
                                cursor: "pointer",
                            },
                        }}
                        initialState={{
                            pagination: {
                                paginationModel: { pageSize: 25, page: 0 },
                            },
                        }}
                        pageSizeOptions={[10, 25, 50, 100]}
                        slots={{
                            noRowsOverlay: NoRowsOverlayWithMessage,
                            row: ThreatsGridRowSlot,
                        }}
                    />
                </Box>
                <Routes>
                    <Route path="edit" element={<ThreatDialogPage />} />
                    <Route path="measureImpacts/edit" element={<MeasureImpactByMeasureDialogPage />}>
                        <Route path="measures/add" element={<AddMeasureDialogPage />} />
                    </Route>
                </Routes>
            </Page>
        </Box>
    );
};

export const ThreatsPage = memo(CreatePage(HeaderUtilityControls, withProject(ThreatsPageBody), true));
ThreatsPage.displayName = "ThreatsPage";
