import Visibility from "@mui/icons-material/Visibility";
import {
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    LinearProgress,
    Menu,
    MenuItem,
    Popper,
    Typography,
} from "@mui/material";
import { DataGrid, GridRow, type GridColumnVisibilityModel, type GridRowProps } from "@mui/x-data-grid";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { ThreatsActions } from "#application/actions/threats.actions.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { useEditor } from "#application/hooks/use-editor.hook.ts";
import {
    useGenericThreatsList,
    type ExtendedThreatWithMetrics,
} from "#application/hooks/use-generic-threats-list.hook.ts";
import { NoRowsOverlay } from "#view/components/no-rows-overlay.component.tsx";
import { Page } from "#view/components/page.component.tsx";
import { SearchField } from "#view/components/search-field.component.tsx";
import { CreatePage } from "#view/components/create-page.component.tsx";
import { usePageTitle } from "#application/hooks/use-page-title.hook.ts";
import { HeaderUtilityControls } from "#view/components/header-utility-controls.component.tsx";
import ThreatDialogPage from "./threat-dialog.page";
import { MeasureImpactByMeasureDialogPage } from "./measure-impact-by-measure-dialog.page";
import AddMeasureDialogPage from "./add-measure-dialog.page";
import { withProject } from "#view/components/with-project.hoc.tsx";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import type { Threat, ExtendedThreat } from "#api/types/threat.types.ts";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import {
    createThreatsColumns,
    formatComponentName,
    GENERIC_THREAT_ROW_PREFIX,
    THREAT_ROW_PREFIX,
    type ThreatsGridRow,
} from "./create-threats-columns";

// Fields whose values only exist on child threats; a filter on them can never
// match a generic (parent) threat directly.
const childOnlyFilterFields = ["assets", "probability", "damage", "risk", "status"] as const;

// The e2e page objects locate action buttons inside the row-level test ids, so
// the ids must live on the grid row element itself, not on a single cell.
const ThreatsGridRowSlot = (props: GridRowProps) => {
    const rowId = String(props.rowId);
    const testId = rowId.startsWith(GENERIC_THREAT_ROW_PREFIX)
        ? "threats-page_generic-threats-list-entry"
        : rowId.startsWith(THREAT_ROW_PREFIX)
          ? "threats-page_threats-list-entry"
          : undefined;
    return <GridRow {...props} data-testid={testId} />;
};

/**
 * on this page all threats are listed
 * @component
 * @category Pages
 */
const ThreatsPageBody = () => {
    const { projectId: projectIdParam = "0" } = useParams<{ projectId?: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { openConfirm } = useConfirm<Threat>();
    const navigate = useNavigate();
    const { t } = useTranslation("threatsPage");
    usePageTitle(t("threats"));

    const { autoSaveStatus } = useEditor({ projectId: projectId });

    const {
        setSearchValue: setGenericThreatSearchValue,
        loadGenericThreats,
        isPending: isGenericThreatsPending,
        genericThreats,
        expandedGenericThreatIds,
        threatsByGenericThreatId,
        toggleGenericThreat,
    } = useGenericThreatsList({ projectId });

    const userRole = useAppSelector((state) => state.projects.current?.role);

    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
        setGenericThreatSearchValue(event.target.value);
    };

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

    useEffect(() => {
        if (autoSaveStatus === "upToDate") {
            void loadGenericThreats();
        }
    }, [autoSaveStatus, loadGenericThreats]);

    const [assetAnchorEl, setAssetAnchorEl] = useState<HTMLElement | null>(null);
    const [currentAssetList, setCurrentAssetList] = useState<ExtendedThreat["assets"] | null>(null);

    const handleAssetHover = useCallback((event: React.MouseEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => {
        setCurrentAssetList(assets);
        setAssetAnchorEl(event.currentTarget);
    }, []);

    const handleAssetHoverEnd = useCallback(() => {
        setAssetAnchorEl(null);
    }, []);

    const onClickEditThreat = useCallback(
        (event: React.MouseEvent<HTMLElement>, threat: ExtendedThreat | undefined) => {
            event.preventDefault();
            if (threat) {
                navigate(`/projects/${projectId}/threats/edit?threatId=${threat.id}`, { state: { threat } });
            }
        },
        [navigate, projectId]
    );

    const handleAddThreat = useCallback(
        async (event: React.MouseEvent<HTMLElement>, genericThreat: GenericThreatWithExtendedChildren) => {
            event.preventDefault();
            // Keep the add button from toggling the parent row's expand/collapse.
            event.stopPropagation();
            try {
                // Only the name is overridden; identity and assessment defaults come
                // from the parent and its catalogue threat on the backend.
                await dispatch(
                    ThreatsActions.createThreat({
                        projectId: Number(projectId),
                        genericThreatId: genericThreat.id,
                        name: `${genericThreat.name} (${t("newThreatSuffix")})`,
                    })
                ).unwrap();
                if (!expandedGenericThreatIds[genericThreat.id]) {
                    toggleGenericThreat(genericThreat.id);
                }
                void loadGenericThreats();
            } catch {
                // handled globally
            }
        },
        [dispatch, projectId, t, expandedGenericThreatIds, toggleGenericThreat, loadGenericThreats]
    );

    const handleDuplicateThreat = useCallback(
        (event: React.MouseEvent<HTMLElement>, threat: Threat) => {
            event.preventDefault();
            openConfirm({
                state: threat,
                message: t("duplicateMessage", { threatName: threat.name }),
                acceptText: t("duplicate"),
                cancelText: t("cancel"),
                acceptColor: "secondary",
                onAccept: async (threat) => {
                    try {
                        const payload = {
                            projectId: Number(projectId),
                            genericThreatId: threat.genericThreatId,
                            name: `${threat.name} (${t("duplicateSuffix")})`,
                            description: threat.description,
                            probability: threat.probability,
                            confidentiality: threat.confidentiality,
                            integrity: threat.integrity,
                            availability: threat.availability,
                            status: THREAT_STATUSES.NEW,
                        };

                        await dispatch(ThreatsActions.createThreat(payload)).unwrap();
                        void loadGenericThreats();
                    } catch {
                        // swallow; error handling via global error handler
                    }
                },
            });
        },
        [openConfirm, t, dispatch, projectId, loadGenericThreats]
    );

    const handleDeleteThreat = useCallback(
        (event: React.MouseEvent<HTMLElement>, threat: Threat) => {
            event.preventDefault();
            // Prevent deleting the only child threat for a generic threat
            const siblings = threatsByGenericThreatId[threat.genericThreatId] ?? [];
            if (siblings.length <= 1) {
                openConfirm({
                    state: threat,
                    message: t("cannotDeleteOnlyThreat", { threatName: threat.name }),
                    acceptText: t("ok"),
                    cancelText: t("cancel"),
                });
                return;
            }

            openConfirm({
                state: threat,
                message: t("deleteMessage", { threatName: threat.name }),
                acceptText: t("delete"),
                cancelText: t("cancel"),
                onAccept: async (threat) => {
                    try {
                        await dispatch(
                            ThreatsActions.deleteThreat({ id: threat.id, projectId: Number(projectId) })
                        ).unwrap();
                        void loadGenericThreats();
                    } catch {
                        // handled globally
                    }
                },
            });
        },
        [threatsByGenericThreatId, openConfirm, t, dispatch, projectId, loadGenericThreats]
    );

    const SESSION_STORAGE_KEY = `threats-column-visibility-${projectId}`;

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
        name: t("name"),
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

    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

    const handleFilterChange = useCallback((field: string, value: string) => {
        setColumnFilters((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleFilterExpanded = useCallback((field: string) => {
        setExpandedFilters((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    // The grid's own filtering would treat parent and child rows independently and
    // tear the hierarchy apart, so filters are applied here while building the rows.
    const matchesChildFilters = useCallback(
        (threat: ExtendedThreatWithMetrics): boolean => {
            return Object.entries(columnFilters).every(([field, value]) => {
                const filterValue = value.trim().toLowerCase();
                if (!filterValue) {
                    return true;
                }
                switch (field) {
                    case "name":
                        return threat.name.toLowerCase().includes(filterValue);
                    case "assets":
                        return String(threat.assets.length).includes(filterValue);
                    case "componentName":
                        return formatComponentName(threat, t).toLowerCase().includes(filterValue);
                    case "pointOfAttack":
                        return t(`pointsOfAttackList.${threat.pointOfAttack}`).toLowerCase().includes(filterValue);
                    case "attacker":
                        return t(`attackerList.${threat.attacker}`).toLowerCase().includes(filterValue);
                    case "probability":
                        return String(threat.probability).includes(filterValue);
                    case "damage":
                        return String(threat.damage).includes(filterValue);
                    case "risk":
                        return String(threat.risk).includes(filterValue);
                    case "status":
                        return threat.status === value;
                    default:
                        return true;
                }
            });
        },
        [columnFilters, t]
    );

    const matchesParentFilters = useCallback(
        (genericThreat: GenericThreatWithExtendedChildren): boolean => {
            return Object.entries(columnFilters).every(([field, value]) => {
                const filterValue = value.trim().toLowerCase();
                if (!filterValue) {
                    return true;
                }
                switch (field) {
                    case "name":
                        return genericThreat.name.toLowerCase().includes(filterValue);
                    case "componentName":
                        return formatComponentName(genericThreat, t).toLowerCase().includes(filterValue);
                    case "pointOfAttack":
                        return t(`pointsOfAttackList.${genericThreat.pointOfAttack}`)
                            .toLowerCase()
                            .includes(filterValue);
                    case "attacker":
                        return t(`attackerList.${genericThreat.attacker}`).toLowerCase().includes(filterValue);
                    default:
                        return true;
                }
            });
        },
        [columnFilters, t]
    );

    const rows = useMemo<ThreatsGridRow[]>(() => {
        const hasChildOnlyFilter = childOnlyFilterFields.some((field) => (columnFilters[field] ?? "").trim() !== "");

        const result: ThreatsGridRow[] = [];
        for (const genericThreat of genericThreats) {
            const children = threatsByGenericThreatId[genericThreat.id] ?? [];
            const visibleChildren = children.filter(matchesChildFilters);

            const parentVisible =
                visibleChildren.length > 0 || (!hasChildOnlyFilter && matchesParentFilters(genericThreat));
            if (!parentVisible) {
                continue;
            }

            const isExpanded = expandedGenericThreatIds[genericThreat.id] ?? false;
            result.push({
                rowType: "genericThreat",
                rowId: `${GENERIC_THREAT_ROW_PREFIX}${genericThreat.id}`,
                genericThreat,
                childCount: visibleChildren.length,
                isExpanded,
            });
            if (isExpanded) {
                if (visibleChildren.length === 0) {
                    result.push({ rowType: "emptyChildren", rowId: `empty-${genericThreat.id}` });
                } else {
                    for (const threat of visibleChildren) {
                        result.push({
                            rowType: "threat",
                            rowId: `${THREAT_ROW_PREFIX}${threat.id}`,
                            threat,
                        });
                    }
                }
            }
        }
        return result;
    }, [
        genericThreats,
        threatsByGenericThreatId,
        expandedGenericThreatIds,
        columnFilters,
        matchesChildFilters,
        matchesParentFilters,
    ]);

    const NoRowsOverlayWithMessage = useCallback(() => <NoRowsOverlay message={t("noThreatsFound")} />, [t]);

    const columns = useMemo(
        () =>
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
        ]
    );

    const genericThreatsCount = genericThreats.length;

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
                            <SearchField onChange={onChangeSearchValue} data-testid="ThreatSearch" />
                            <Button
                                onClick={handleClick}
                                startIcon={<Visibility sx={{ fontSize: 18 }} />}
                                sx={{ ml: 2, textTransform: "none", color: "text.primary" }}
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
                        {genericThreatsCount > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography sx={{ mr: 0.5, fontWeight: "bold", color: "primary.text" }}>
                                    {genericThreatsCount}
                                </Typography>
                                <Typography>{t("threatsFound")}</Typography>
                            </Box>
                        )}
                    </Box>

                    <DataGrid
                        rows={rows}
                        columns={columns}
                        getRowId={(row) => row.rowId}
                        loading={isGenericThreatsPending}
                        disableRowSelectionOnClick
                        disableColumnFilter
                        disableColumnMenu
                        disableColumnSelector
                        onCellClick={(params, event) => {
                            const row = params.row as ThreatsGridRow;
                            // A parent row toggles from any cell (including the "n threats" text in
                            // the actions cell); its add button stops propagation to keep its action.
                            if (row.rowType === "genericThreat") {
                                toggleGenericThreat(row.genericThreat.id);
                            } else if (row.rowType === "threat" && params.field !== "actions") {
                                onClickEditThreat(event as unknown as React.MouseEvent<HTMLElement>, row.threat);
                            }
                        }}
                        getRowClassName={(params) => {
                            const row = params.row as ThreatsGridRow;
                            // Finalized / out-of-scope threats are visually de-emphasised as a hint,
                            // but nothing is actually blocked — the status and the action buttons stay
                            // at full opacity (see the per-cell overrides below) so they remain
                            // clearly readable and usable.
                            if (
                                row.rowType === "threat" &&
                                (row.threat.status === THREAT_STATUSES.FINALIZED ||
                                    row.threat.status === THREAT_STATUSES.OUTOFSCOPE)
                            ) {
                                return "threats-grid--dimmed";
                            }
                            return "";
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
                            // Dim per cell (not per row) so the exemptions below can win.
                            "& .threats-grid--dimmed .MuiDataGrid-cell": { opacity: 0.6 },
                            "& .threats-grid--dimmed .MuiDataGrid-cell[data-field='status']": { opacity: 1 },
                            "& .threats-grid--dimmed .MuiDataGrid-cell[data-field='actions']": { opacity: 1 },
                        }}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25, page: 0 } },
                        }}
                        pageSizeOptions={[10, 25, 50, 100]}
                        slots={{ noRowsOverlay: NoRowsOverlayWithMessage, row: ThreatsGridRowSlot }}
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
