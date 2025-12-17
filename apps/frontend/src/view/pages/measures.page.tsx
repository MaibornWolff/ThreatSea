import { Add, ContentCopyOutlined, Delete, Replay } from "@mui/icons-material";
import { Box, LinearProgress, Table, TableBody, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useLayoutEffect } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useParams } from "react-router-dom";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { Page } from "../components/page.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import { withProject } from "../components/with-project.hoc";
import MeasureDetailsDialogPage from "./measure-details-dialog.page";
import { IconButton } from "../components/icon-button.component";
import { CustomTableHeaderCell } from "../components/table-header.component";
import CustomTableCell from "../components/table-cell.component";
import { useMeasuresList } from "../../application/hooks/use-measures-list.hook";
import { SearchField } from "../components/search-field.component";
import { MeasureImpactByThreatDialogPage } from "./measure-impact-by-threat-dialog.page";
import ThreatDialogPage from "./threat-dialog.page";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";

interface MeasuresPageBodyProps {
    project: ExtendedProject;
}

/**
 * on this page all measures are listed
 *
 * @component
 * @category Pages
 * @return {Component}
 */
type MeasureDialogState = Omit<Partial<Measure>, "id" | "scheduledAt"> & {
    id?: number | undefined;
    scheduledAt?: Date | undefined;
    active?: boolean;
};

const MeasuresPageBody = ({ project }: MeasuresPageBodyProps) => {
    const { t } = useTranslation("measuresPage");
    const { openConfirm } = useConfirm<Measure>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { projectId: projectIdParam = "0" } = useParams<{ projectId: string }>();
    const projectId = Number.parseInt(projectIdParam, 10);
    const { setSortDirection, setSearchValue, setSortBy, deleteMeasure, sortDirection, sortBy, isPending, measures } =
        useMeasuresList({ projectId });

    const userRole = useAppSelector((state) => state.projects.current?.role);

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
    }, [dispatch]);

    const onChangeSortBy = (_event: SyntheticEvent, newSortBy: string | null) => {
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
     * Changes the search filter of the list view.
     * @event Box#onChange
     * @param e - Event of the change.
     */
    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const onClickDeleteMeasure = (event: React.MouseEvent<HTMLElement>, measure: Measure) => {
        event.stopPropagation();
        const isReset = measure.catalogMeasureId !== undefined && measure.catalogMeasureId != null;
        openConfirm({
            state: measure,
            message:
                isReset === true
                    ? t("resetMeasureText", { measureName: measure.name })
                    : t("deleteMeasureText", { measureName: measure.name }),
            acceptText: isReset === true ? t("resetText") : t("deleteText"),
            cancelText: t("cancelText"),
            onAccept: (measure) => {
                deleteMeasure(measure);
            },
        });
    };

    const onClickAddMeasure = () => {
        const measureState: MeasureDialogState = {
            active: false,
            projectId: project.id,
        };
        navigate(`/projects/${projectIdParam}/measures/edit`, {
            state: {
                measure: measureState,
                project,
            },
        });
    };

    const onClickEditMeasure = (event: React.MouseEvent<HTMLElement>, measure: Measure) => {
        event.preventDefault();
        const scheduledAt = new Date(
            measure.scheduledAt.getTime() - measure.scheduledAt.getTimezoneOffset() * 60 * 1000
        );
        const measureState: MeasureDialogState = {
            ...measure,
            scheduledAt,
        };
        navigate(`/projects/${projectIdParam}/measures/edit`, {
            state: {
                project,
                measure: measureState,
            },
        });
    };

    const onClickDuplicateMeasure = (event: React.MouseEvent<HTMLElement>, measure: Measure) => {
        event.stopPropagation();
        const measureState: MeasureDialogState = {
            ...measure,
            active: false,
            catalogMeasureId: null,
            id: undefined,
            name: t("duplicateName", { name: measure.name }),
            scheduledAt: undefined,
        };
        navigate(`/projects/${projectIdParam}/measures/edit`, {
            state: {
                measure: measureState,
                project,
            },
        });
    };

    const handleMeasureCount = (): string => {
        if (measures.length > 1) return t("measuresFound");
        return t("measureFound");
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
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 1,
                            paddingBottom: 2,
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <SearchField onChange={onChangeSearchValue} data-testid="SearchAsset" />
                            {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                <IconButton
                                    title={t("addMeasure")}
                                    sx={{
                                        ml: 1,
                                        color: "text.primary",
                                    }}
                                    onClick={onClickAddMeasure}
                                    data-testid="measures-page_add-measure-button"
                                >
                                    <Add sx={{ fontSize: 18 }} />
                                </IconButton>
                            )}
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {measures.length > 0 && (
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
                                        {measures.length}
                                    </Typography>
                                    <Typography>{handleMeasureCount()}</Typography>
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
                            {/*Measure Table*/}
                            <TableContainer
                                sx={{
                                    height: "100%",
                                    overflowY: "auto",
                                    position: "relative",
                                    width: "100%",
                                    "&::-webkit-scrollbar": {
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        overflow: "hidden",
                                    },
                                    "&::-webkit-scrollbar-corner": {
                                        borderRadius: 5,
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
                                                onClick={onChangeSortBy}
                                                data-testid="measures-page_sort-measures-by-name-button"
                                            >
                                                {t("name")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                name="scheduledAt"
                                                sortBy={sortBy}
                                                sortDirection={sortDirection}
                                                onClick={onChangeSortBy}
                                                data-testid="measures-page_sort-measures-by-scheduled-at-button"
                                            >
                                                {t("scheduledAt")}
                                            </CustomTableHeaderCell>
                                            <CustomTableHeaderCell
                                                showBorder={false}
                                                sx={{
                                                    width: "1%",
                                                    borderRightColor: "#fff",
                                                    padding: 0,
                                                }}
                                            ></CustomTableHeaderCell>
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
                                                {t("measuresLoading")}
                                            </Typography>
                                        )}
                                        {measures.length === 0 && !isPending && (
                                            <Typography
                                                sx={{
                                                    paddingTop: 2,
                                                    paddingLeft: 2,
                                                    fontSize: "0.75rem",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                {t("noMeasuresFound")}
                                            </Typography>
                                        )}
                                        {!isPending &&
                                            measures.map((measure, i) => {
                                                const { name, scheduledAt } = measure;
                                                return (
                                                    <TableRow
                                                        key={i}
                                                        onClick={(e) => onClickEditMeasure(e, measure)}
                                                        sx={{
                                                            backgroundColor: "background.mainIntransparent",
                                                            borderRadius: 5,
                                                            marginBottom: 1,

                                                            "&:last-child td, &:last-child th": { border: 0 },
                                                            "&:hover": {
                                                                cursor: "pointer",
                                                                backgroundColor: "#fff !important",
                                                            },
                                                        }}
                                                        hover
                                                        data-testid="measures-page_measures-list-entry"
                                                    >
                                                        <CustomTableCell
                                                            scope="row"
                                                            showBorder={true}
                                                            sx={{
                                                                position: "relative",
                                                                fontWeight: "bold",
                                                                fontSize: "0.875rem",
                                                                borderRightColor: "#fff",
                                                            }}
                                                            align={"left"}
                                                            data-testid="measures-page_measures-list-entry_name"
                                                        >
                                                            {name}
                                                        </CustomTableCell>
                                                        <CustomTableCell
                                                            showBorder={true}
                                                            sx={{
                                                                borderRightColor: "#fff",
                                                            }}
                                                            data-testid="measures-page_measures-list-entry_scheduled-at"
                                                        >
                                                            <Typography
                                                                sx={{
                                                                    fontSize: "0.875rem",
                                                                }}
                                                            >
                                                                {scheduledAt
                                                                    ? scheduledAt.toISOString().split("T")[0]
                                                                    : t("notScheduledYet")}
                                                            </Typography>
                                                        </CustomTableCell>
                                                        <CustomTableCell
                                                            sx={{
                                                                padding: 0,
                                                            }}
                                                        >
                                                            {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                                                <Box>
                                                                    <IconButton
                                                                        title={t("copy")}
                                                                        onClick={(e) =>
                                                                            onClickDuplicateMeasure(e, measure)
                                                                        }
                                                                        data-testid="measures-page_measures-list-entry_copy-button"
                                                                    >
                                                                        <ContentCopyOutlined
                                                                            sx={{
                                                                                fontSize: 18,
                                                                            }}
                                                                        />
                                                                    </IconButton>
                                                                    {measure.catalogMeasureId && (
                                                                        <IconButton
                                                                            disabled={!scheduledAt}
                                                                            title={t("reset")}
                                                                            onClick={(e) =>
                                                                                onClickDeleteMeasure(e, measure)
                                                                            }
                                                                        >
                                                                            <Replay
                                                                                sx={{
                                                                                    fontSize: 18,
                                                                                }}
                                                                            />
                                                                        </IconButton>
                                                                    )}
                                                                    {!measure.catalogMeasureId && (
                                                                        <IconButton
                                                                            title={t("delete")}
                                                                            hoverColor="error"
                                                                            onClick={(e) =>
                                                                                onClickDeleteMeasure(e, measure)
                                                                            }
                                                                            data-testid="measures-page_measures-list-entry_delete-button"
                                                                        >
                                                                            <Delete
                                                                                sx={{
                                                                                    fontSize: 18,
                                                                                }}
                                                                            />
                                                                        </IconButton>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </CustomTableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        <TableRow></TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </Box>
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

export const MeasuresPage = CreatePage(HeaderNavigation, withProject(MeasuresPageBody), true);
