import { Add, Visibility } from "@mui/icons-material";
import { Box, Button, Checkbox, FormControlLabel, LinearProgress, Menu, MenuItem, Typography } from "@mui/material";
import { DataGrid, type GridColumnVisibilityModel, type GridFilterModel } from "@mui/x-data-grid";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { useMeasuresList } from "#application/hooks/use-measures-list.hook.ts";
import { IconButton } from "#view/components/icon-button.component.tsx";
import { Page } from "#view/components/page.component.tsx";
import { CreatePage } from "#view/components/create-page.component.tsx";
import { HeaderUtilityControls } from "#view/components/header-utility-controls.component.tsx";
import { withProject } from "#view/components/with-project.hoc.tsx";
import MeasureDetailsDialogPage from "./measure-details-dialog.page";
import { MeasureImpactByThreatDialogPage } from "./measure-impact-by-threat-dialog.page";
import ThreatDialogPage from "./threat-dialog.page";
import { createMeasuresColumns } from "./measures.columns";

interface MeasuresPageBodyProps {
    project: ExtendedProject;
}

type MeasureDialogState = Omit<Partial<Measure>, "id" | "scheduledAt"> & {
    id?: number | undefined;
    scheduledAt?: Date | undefined;
    active?: boolean;
};

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

const MeasuresPageBody = ({ project }: MeasuresPageBodyProps) => {
    const { t } = useTranslation("measuresPage");
    const { t: tCommon } = useTranslation("common");
    const { openConfirm } = useConfirm<Measure>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { projectId: projectIdParam = "0" } = useParams<{ projectId: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { deleteMeasure, isPending, measures } = useMeasuresList({ projectId });

    const userRole = useAppSelector((state) => state.projects.current?.role);

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

    const SESSION_STORAGE_KEY = `measures-column-visibility-${projectId}`;

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
            scheduledAt: true,
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
        scheduledAt: tCommon("scheduledAt"),
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

    const onClickAddMeasure = () => {
        const measureState: MeasureDialogState = {
            active: false,
            projectId: project.id,
        };
        navigate(`/projects/${projectIdParam}/measures/edit`, {
            state: { measure: measureState, project },
        });
    };

    const onClickEditMeasure = (measure: Measure) => {
        const scheduledAt = measure.scheduledAt
            ? new Date(measure.scheduledAt.getTime() - measure.scheduledAt.getTimezoneOffset() * 60 * 1000)
            : undefined;
        const measureState: MeasureDialogState = { ...measure, scheduledAt };
        navigate(`/projects/${projectIdParam}/measures/edit`, {
            state: { project, measure: measureState },
        });
    };

    const handleDuplicateMeasure = useCallback(
        (measure: Measure) => {
            const measureState: MeasureDialogState = {
                ...measure,
                active: false,
                catalogMeasureId: null,
                id: undefined,
                name: tCommon("duplicateName", { name: measure.name }),
                scheduledAt: undefined,
            };
            navigate(`/projects/${projectIdParam}/measures/edit`, {
                state: { measure: measureState, project },
            });
        },
        [navigate, projectIdParam, project, tCommon]
    );

    const handleDeleteOrResetMeasure = useCallback(
        (measure: Measure) => {
            const isReset = measure.catalogMeasureId != null;
            openConfirm({
                state: measure,
                message: isReset
                    ? tCommon("resetMeasureText", { measureName: measure.name })
                    : tCommon("deleteMeasureText", { measureName: measure.name }),
                acceptText: isReset ? tCommon("resetText") : tCommon("deleteText"),
                cancelText: tCommon("cancelText"),
                onAccept: (measure) => {
                    deleteMeasure(measure);
                },
            });
        },
        [openConfirm, tCommon, deleteMeasure]
    );

    const NoRowsOverlayWithMessage = useCallback(() => <NoRowsOverlay message={t("noMeasuresFound")} />, [t]);

    const columns = useMemo(
        () =>
            createMeasuresColumns({
                t,
                tCommon,
                userRole,
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded,
                handleDuplicateMeasure,
                handleDeleteOrResetMeasure,
            }),
        [
            t,
            tCommon,
            userRole,
            columnFilters,
            handleFilterChange,
            expandedFilters,
            toggleFilterExpanded,
            handleDuplicateMeasure,
            handleDeleteOrResetMeasure,
        ]
    );

    const handleMeasureCount = (): string => {
        if (measures.length > 1) {
            return t("measuresFound");
        }
        return t("measureFound");
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
                                    title={tCommon("addMeasure")}
                                    sx={{ ml: 1, color: "text.primary" }}
                                    onClick={onClickAddMeasure}
                                    data-testid="measures-page_add-measure-button"
                                >
                                    <Add sx={{ fontSize: 18 }} />
                                </IconButton>
                            )}
                        </Box>
                        {measures.length > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Typography sx={{ mr: 0.5, fontWeight: "bold", color: "primary.text" }}>
                                    {measures.length}
                                </Typography>
                                <Typography>{handleMeasureCount()}</Typography>
                            </Box>
                        )}
                    </Box>

                    <DataGrid
                        rows={measures}
                        columns={columns}
                        loading={isPending}
                        disableRowSelectionOnClick
                        disableColumnFilter
                        disableColumnMenu
                        disableColumnSelector
                        filterModel={filterModel}
                        onCellClick={(params) => {
                            if (params.field !== "actions") {
                                onClickEditMeasure(params.row);
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
                    <Route path="edit" element={<MeasureDetailsDialogPage />} />
                    <Route path=":measureId/measureImpacts/edit" element={<MeasureImpactByThreatDialogPage />} />
                    <Route path="threats/edit" element={<ThreatDialogPage />} />
                </Routes>
            </Page>
        </Box>
    );
};

export const MeasuresPage = CreatePage(HeaderUtilityControls, withProject(MeasuresPageBody), true);
