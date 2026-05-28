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
import { DataGrid, type GridFilterModel, type GridColumnVisibilityModel } from "@mui/x-data-grid";
import { Visibility } from "@mui/icons-material";
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { useEditor } from "../../application/hooks/use-editor.hook";
import { useThreatsList, type ThreatListItem } from "../../application/hooks/use-threats-list.hook";
import { Page } from "../components/page.component";
import { CreatePage } from "../components/create-page.component";
import { HeaderUtilityControls } from "../components/header-utility-controls.component";
import ThreatDialogPage from "./threat-dialog.page";
import { withProject } from "../components/with-project.hoc";
import { createThreatsColumns } from "./threats.columns";

/**
 * NoRowsOverlay component for the threats data grid
 */
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

/**
 * on this page all threats are listed
 * @component
 * @category Pages
 */
const ThreatsPageBody = ({ project }: { project: ExtendedProject }) => {
    const { projectId: projectIdParam = "0" } = useParams<{ projectId?: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { openConfirm } = useConfirm<ExtendedThreat>();
    const navigate = useNavigate();
    const { t } = useTranslation("threatsPage");
    const { t: tCommon } = useTranslation("common");

    const NoRowsOverlayWithMessage = useCallback(() => <NoRowsOverlay message={t("noThreatsFound")} />, [t]);

    const { duplicateThreat, deleteThreat, loadThreats, isPending, threats } = useThreatsList({ projectId: projectId });

    const { autoSaveStatus } = useEditor({ projectId: projectId });

    const userRole = project.role;

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

    // Column visibility state management
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
            doneEditing: true,
            actions: true,
        };
    };

    const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>(getInitialColumnVisibility);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const toggleColumnVisibility = (field: string) => {
        setColumnVisibility((prev) => {
            const newVisibility = {
                ...prev,
                [field]: !prev[field],
            };
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newVisibility));
            return newVisibility;
        });
    };

    const columnLabels: Record<string, string> = {
        name: tCommon("name"),
        assets: tCommon("assets"),
        componentName: tCommon("componentName"),
        pointOfAttack: tCommon("pointOfAttack"),
        attacker: tCommon("attacker"),
        probability: tCommon("probability"),
        damage: tCommon("damage"),
        risk: tCommon("risk"),
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

    useEffect(() => {
        if (autoSaveStatus === "upToDate") {
            loadThreats();
        }
    }, [autoSaveStatus, loadThreats]);

    const [assetAnchorEl, setAssetAnchorEl] = useState<HTMLElement | null>(null);
    const [currentAssetList, setCurrentAssetList] = useState<ExtendedThreat["assets"] | null>(null);
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});

    /**
     * Make the Popper show the asset list for the threat the mouse is over
     */
    const handleAssetHover = (event: React.MouseEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => {
        setCurrentAssetList(assets);
        setAssetAnchorEl(event.currentTarget);
    };

    const handleFilterChange = useCallback((field: string, value: string) => {
        setColumnFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const toggleFilterExpanded = useCallback((field: string) => {
        setExpandedFilters((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    }, []);

    const filterModel: GridFilterModel = useMemo(
        () => ({
            items: Object.entries(columnFilters)
                .filter(([_, value]) => value.trim() !== "")
                .map(([field, value]) => ({
                    field,
                    operator: field === "doneEditing" ? "equals" : "contains",
                    value,
                })),
        }),
        [columnFilters]
    );

    const columns = useMemo(
        () =>
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
        [
            t,
            userRole,
            columnFilters,
            handleFilterChange,
            handleDuplicateThreat,
            handleDeleteThreat,
            expandedFilters,
            toggleFilterExpanded,
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
                                    {threats.length}
                                </Typography>
                                <Typography>{t("threatsFound")}</Typography>
                            </Box>
                        )}
                    </Box>

                    <DataGrid
                        rows={threats}
                        columns={columns}
                        loading={isPending}
                        disableRowSelectionOnClick
                        disableColumnFilter
                        disableColumnMenu
                        disableColumnSelector
                        filterModel={filterModel}
                        onCellClick={(params) => {
                            if (params.field !== "actions") {
                                onClickEditThreat(params.row);
                            }
                        }}
                        getRowClassName={(params) => (params.row.doneEditing ? "row-done-editing" : "")}
                        columnHeaderHeight={90}
                        columnVisibilityModel={columnVisibility}
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
                        }}
                    />
                </Box>
                <Routes>
                    <Route path="edit" element={<ThreatDialogPage />} />
                </Routes>
            </Page>
        </Box>
    );
};

export const ThreatsPage = CreatePage(HeaderUtilityControls, withProject(ThreatsPageBody), true);
