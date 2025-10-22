import { Add, CalendarToday, Delete, EventAvailable } from "@mui/icons-material";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography,
} from "@mui/material";
import { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Route } from "react-router";
import { Routes, useNavigate, useParams } from "react-router-dom";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { ProjectsActions } from "../../application/actions/projects.actions";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { useMatrix } from "../../application/hooks/use-matrix.hook";
import MATRIX_COLOR from "../colors/matrix";
import { IconButton } from "../components/icon-button.component";
import { LineOfToleranceSelector } from "../components/line-of-tolerance-selector.component";
import { Matrix } from "../components/matrix.component";
import { MeasureTimeline } from "../components/measure-timeline.component";
import { Page } from "../components/page.component";
import { SearchField } from "../components/search-field.component";
import { Tooltip } from "../components/tooltip.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import { withProject } from "../components/with-project.hoc";
import MeasureImpactByMeasureDialogPage from "./measure-impact-by-measure-dialog.page";
import { useEditor } from "../../application/hooks/use-editor.hook";
import ThreatDialogPage from "./threat-dialog.page";
import AddMeasureDialogPage from "./add-measure-dialog.page";
import { AlertActions } from "../../application/actions/alert.actions";
import MeasureDetailsDialogPage from "./measure-details-dialog.page";

/**
 * on this page all assets are listed
 *
 * @component
 * @category Pages
 * @return {Component}
 */
const RiskPageBody = ({ project }) => {
    const {
        t,
        i18n: { language },
    } = useTranslation("riskPage");
    const {
        timeline,
        matrix,
        threats,
        sortDirection,
        sortBy,
        setThreatSearchValue,
        currentGreenValue,
        currentRedValue,
        setCurrentGreenValue,
        setCurrentRedValue,
        setSortDirection,
        setSortBy,
        setSelectedCell,
        setTimelineDate,
        loadThreats,
        deleteMeasureImpact,
    } = useMatrix({
        projectId: project.id,
        catalogId: project.catalogId,
        language,
    });

    const { lineOfToleranceGreen, lineOfToleranceRed } = project;
    const { openConfirm } = useConfirm();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [selectedThreat, setSelectedThreat] = useState(0);
    const [measureSortBy, setMeasureSortBy] = useState("name");
    const [measureSortDirection, setMeasureSortDirection] = useState("asc");

    const userRole = useSelector((state) => state.projects.current?.role);

    const projectId = parseInt(useParams().projectId);

    const { autoSaveStatus } = useEditor({ projectId: projectId });

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

    const handleOnThreatSearchChanged = (e) => {
        setThreatSearchValue(e.target.value);
    };

    const handleChangeTimeline = (e, date) => {
        setTimelineDate(date);
    };

    const handleSelectMatrixCell = (e, cell) => {
        setSelectedCell(cell);
    };

    const onChangeSortBy = (_, newSortBy) => {
        if (sortBy === newSortBy) {
            const newSortDirection = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? "asc" : null;

            if (newSortDirection) {
                setSortDirection(newSortDirection);
            }
        } else if (newSortBy) {
            setSortBy(newSortBy);
        }
    };

    const onClickApplyMeasure = (threat) => {
        if (threat != null) {
            navigate(`/projects/${projectId}/risk/measureImpacts/edit`, {
                state: {
                    threat,
                    project,
                },
            });
        }
    };

    const onCLickEditMeasureImpact = (threat, measureImpact) => {
        navigate(`/projects/${projectId}/risk/measureImpacts/edit`, {
            state: {
                threat,
                measureImpact,
                project,
            },
        });
    };

    const onChangeMeasureSortBy = (_, newSortBy) => {
        if (measureSortBy === newSortBy) {
            const newSortDirection =
                measureSortDirection === "asc" ? "desc" : measureSortDirection === "desc" ? "asc" : null;
            if (newSortDirection) {
                setMeasureSortDirection(newSortDirection);
            }
        } else if (newSortBy) {
            setMeasureSortBy(newSortBy);
        }
    };

    const onClickEditAppliedMeasure = (e, measure) => {
        e.stopPropagation();

        navigate(`/projects/${projectId}/risk/appliedMeasure/edit`, {
            state: {
                project,
                measure: {
                    ...measure,
                    id: measure.measureId,
                    projectId,
                    scheduledAt: new Date(
                        measure.scheduledAt.getTime() - measure.scheduledAt.getTimezoneOffset() * 60 * 1000
                    )
                        .toISOString()
                        .split("T")[0],
                },
            },
        });
    };

    const onClickDeleteMeasureImpact = (e, measureName, threatName, measureImpact) => {
        e.preventDefault();
        e.stopPropagation();
        openConfirm({
            state: measureImpact,
            message: t("measureImpactDeleteMessage", {
                measureName: measureName,
                threatName: threatName,
            }),
            cancelText: t("cancelBtn"),
            acceptText: t("deleteBtn"),
            onAccept: (measureImpact) => {
                const data = { ...measureImpact, projectId };
                deleteMeasureImpact(data);
            },
        });
    };

    const handleChangeLineOfTolerance = (newValue, save) => {
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            const newGreenValue = newValue[0];
            const newRedValue = newValue[1];
            setCurrentGreenValue(newGreenValue);
            setCurrentRedValue(newRedValue);
            if (save && (newGreenValue !== lineOfToleranceGreen || newRedValue !== lineOfToleranceRed)) {
                dispatch(
                    ProjectsActions.updateProject({
                        ...project,
                        lineOfToleranceGreen: newGreenValue,
                        lineOfToleranceRed: newRedValue,
                    })
                );
            }
        } else {
            dispatch(
                AlertActions.openErrorAlert({
                    text: "Users with Viewer role may not change the slider for the line of tolerance.",
                })
            );
        }
    };

    const handleSelectThreat = (threatIndex) => {
        setSelectedThreat(threatIndex);
    };

    const handleEditThreat = (threadIndex, threat) => {
        setSelectedThreat(threadIndex);
        if (checkUserRole(userRole, USER_ROLES.EDITOR)) {
            navigate(`/projects/${projectId}/risk/threats/edit`, {
                state: {
                    threat,
                },
            });
        }
    };

    useEffect(() => {
        if (autoSaveStatus === "upToDate") {
            loadThreats();
        }
    }, [autoSaveStatus, loadThreats]);

    return (
        <Page sx={{ boxSizing: "border-box" }}>
            <MeasureTimeline
                language={language}
                timeline={timeline}
                onChange={handleChangeTimeline}
                sx={{
                    marginTop: 6,
                    boxSizing: "border-box",
                }}
            />

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    position: "relative",
                    flex: 1,
                    mt: 8,
                    mb: 2,
                    paddingBottom: "2px",
                    paddingRight: "2px",
                    paddingTop: "2px",
                    overflowY: "hidden",
                    height: "100%",
                    boxSizing: "border-box",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignSelf: "flex-end",
                            marginBottom: 6,
                            boxSizing: "border-box",
                        }}
                    >
                        <Matrix matrix={matrix} size={50} onSelectCell={handleSelectMatrixCell} />
                        <LineOfToleranceSelector
                            title={t("lineOfTolerance.title")}
                            greenValue={currentGreenValue}
                            redValue={currentRedValue}
                            onLoTChange={handleChangeLineOfTolerance}
                        />
                    </Box>
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        width: "100%",
                        padding: 4,
                        boxShadow: 1,
                        backgroundColor: "#fff",
                        borderRadius: 5,
                        marginLeft: 10,
                        overflowY: "hidden",
                        boxSizing: "border-box",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            justifyContent: "space-between",
                            paddingBottom: 2,
                            boxSizing: "border-box",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                boxSizing: "border-box",
                                width: "100%",
                                marginRight: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "0.875rem",
                                    fontWeight: "bold",
                                }}
                            >
                                {t("threats")}
                            </Typography>
                            <SearchField onChange={handleOnThreatSearchChanged} />
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                boxSizing: "border-box",
                                width: "100%",
                                alignItems: "center",
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: "0.875rem",
                                    fontWeight: "bold",
                                }}
                            >
                                {t("measures")}
                            </Typography>
                            {checkUserRole(userRole, USER_ROLES.EDITOR) && threats[selectedThreat] && (
                                <IconButton
                                    title={t("applyMeasure")}
                                    sx={{ boxSizing: "border-box" }}
                                    onClick={() => onClickApplyMeasure(threats[selectedThreat])}
                                >
                                    <Add sx={{ fontSize: 18 }} />
                                </IconButton>
                            )}
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            height: "100%",
                            overflow: "hidden",
                            padding: "2px",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "flex-end",
                                height: "100%",
                                width: "100%",
                                boxSizing: "border-box",
                            }}
                        >
                            <Box
                                sx={{
                                    borderRadius: 5,
                                    boxShadow: 1,
                                    overflowX: "hidden",
                                    height: "100%",
                                    width: "100%",
                                }}
                            >
                                <Box
                                    sx={{
                                        borderRadius: 5,
                                        height: "100%",
                                        width: "100%",
                                    }}
                                >
                                    {/*Threats Table*/}
                                    <TableContainer
                                        sx={{
                                            borderRadius: 5,
                                            height: "100%",
                                            overflowY: "auto",
                                            overflowX: "auto",
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
                                                    <ThreatTableHeaderCell
                                                        sx={{
                                                            borderTopLeftRadius: 5,
                                                        }}
                                                        name="name"
                                                        sortBy={sortBy}
                                                        sortDirection={sortDirection}
                                                        showBorder={false}
                                                        onClick={onChangeSortBy}
                                                    >
                                                        {t("name")}
                                                    </ThreatTableHeaderCell>
                                                    <ThreatTableHeaderCell
                                                        name="newProbability"
                                                        sortBy={sortBy}
                                                        sortDirection={sortDirection}
                                                        showBorder={false}
                                                        onClick={onChangeSortBy}
                                                    >
                                                        {t("probability")}
                                                    </ThreatTableHeaderCell>
                                                    <ThreatTableHeaderCell
                                                        name="newRisk"
                                                        sortBy={sortBy}
                                                        sortDirection={sortDirection}
                                                        showBorder={false}
                                                        onClick={onChangeSortBy}
                                                    >
                                                        {t("risk")}
                                                    </ThreatTableHeaderCell>
                                                    <ThreatTableHeaderCell
                                                        name="componentName"
                                                        sortBy={sortBy}
                                                        sortDirection={sortDirection}
                                                        showBorder={false}
                                                        onClick={onChangeSortBy}
                                                        sx={{
                                                            fontWeight: "normal",
                                                        }}
                                                    >
                                                        {t("componentName")}
                                                    </ThreatTableHeaderCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {threats.map((threat, i) => {
                                                    const isSelected = i === selectedThreat;
                                                    let matrixColor, hoverColor, selectedColor;

                                                    if (threat.newDamage === 0) {
                                                        matrixColor = MATRIX_COLOR["grey"].lighter;
                                                        hoverColor = MATRIX_COLOR["grey"].hover;
                                                        selectedColor = MATRIX_COLOR["grey"].light;
                                                    } else {
                                                        const matrixCell =
                                                            matrix[5 - threat.newProbability][threat.newDamage - 1];

                                                        matrixColor = MATRIX_COLOR[matrixCell.color].lighter;
                                                        hoverColor = MATRIX_COLOR[matrixCell.color].hover;
                                                        selectedColor = MATRIX_COLOR[matrixCell.color].light;
                                                    }

                                                    const { name, componentName, pointOfAttack, interfaceName } =
                                                        threat;
                                                    return (
                                                        <TableRow
                                                            key={i}
                                                            sx={{
                                                                backgroundColor: isSelected
                                                                    ? selectedColor
                                                                    : matrixColor,
                                                                borderRadius: 5,
                                                                marginBottom: 1,

                                                                "&:last-child td, &:last-child th": {
                                                                    border: 0,
                                                                },
                                                                "&:hover": {
                                                                    cursor: "pointer",
                                                                    backgroundColor: hoverColor + " !important",
                                                                },
                                                            }}
                                                            onClick={() => handleSelectThreat(i)}
                                                            hover
                                                        >
                                                            <CustomTableCell
                                                                scope="row"
                                                                showBorder={true}
                                                                sx={{
                                                                    position: "relative",
                                                                    fontWeight: "bold",
                                                                    borderRightColor: "#fff",
                                                                    "&:hover": {
                                                                        textDecoration: "underline",
                                                                    },
                                                                }}
                                                                align={"left"}
                                                                onClick={() => handleEditThreat(i, threat)}
                                                            >
                                                                {name}
                                                            </CustomTableCell>
                                                            <CustomTableCell
                                                                showBorder={true}
                                                                sx={{
                                                                    position: "relative",
                                                                    borderRightColor: "#fff",
                                                                }}
                                                            >
                                                                {threat.newProbability}
                                                            </CustomTableCell>
                                                            <CustomTableCell
                                                                showBorder={true}
                                                                sx={{
                                                                    position: "relative",
                                                                    borderRightColor: "#fff",
                                                                }}
                                                            >
                                                                {threat.newRisk}
                                                            </CustomTableCell>
                                                            <CustomTableCell
                                                                showBorder={false}
                                                                sx={{
                                                                    position: "relative",
                                                                    "&:hover .pointOfAttackHoverBox": {
                                                                        display: "inline-block",
                                                                    },
                                                                }}
                                                            >
                                                                <Tooltip
                                                                    title={t(`pointsOfAttackList.${pointOfAttack}`)}
                                                                >
                                                                    <Typography>
                                                                        {threat.pointOfAttack ===
                                                                        "COMMUNICATION_INTERFACES"
                                                                            ? `${componentName || t("unknown")} > ${interfaceName}`
                                                                            : componentName}
                                                                    </Typography>
                                                                </Tooltip>
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

                            {selectedThreat >= 0 && selectedThreat < threats.length && (
                                <Box
                                    sx={{
                                        marginLeft: 4,
                                        borderRadius: 5,
                                        boxShadow: 1,
                                        overflow: "hidden",
                                        width: "100%",
                                        backgroundColor: "background.mainIntransparent",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            borderRadius: 5,
                                            height: "100%",
                                            width: "100%",
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
                                                        <ThreatTableHeaderCell
                                                            showBorder={false}
                                                            sx={{
                                                                width: "1%",
                                                                borderRightColor: "#fff",
                                                                padding: 0,
                                                            }}
                                                        ></ThreatTableHeaderCell>
                                                        <ThreatTableHeaderCell
                                                            name="name"
                                                            sortBy={measureSortBy}
                                                            sortDirection={measureSortDirection}
                                                            showBorder={false}
                                                            onClick={onChangeMeasureSortBy}
                                                            sx={{
                                                                width: "45%",
                                                                fontSize: "0.875rem",
                                                            }}
                                                        >
                                                            {t("name")}
                                                        </ThreatTableHeaderCell>
                                                        <ThreatTableHeaderCell
                                                            name="scheduledAt"
                                                            sortBy={measureSortBy}
                                                            sortDirection={measureSortDirection}
                                                            showBorder={false}
                                                            onClick={onChangeMeasureSortBy}
                                                            sx={{
                                                                fontSize: "0.875rem",
                                                                fontWeight: "normal",
                                                            }}
                                                        >
                                                            {t("scheduledAt")}
                                                        </ThreatTableHeaderCell>
                                                        <ThreatTableHeaderCell></ThreatTableHeaderCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {threats[selectedThreat]?.measures
                                                        .sort((a, b) => {
                                                            if (measureSortDirection === "asc") {
                                                                if (
                                                                    a[measureSortBy]?.toLowerCase &&
                                                                    b[measureSortBy]?.toLowerCase
                                                                ) {
                                                                    return a[measureSortBy].toLowerCase() <
                                                                        b[measureSortBy].toLowerCase()
                                                                        ? -1
                                                                        : 1;
                                                                } else {
                                                                    return a[measureSortBy] < b[measureSortBy] ? -1 : 1;
                                                                }
                                                            } else {
                                                                if (
                                                                    a[measureSortBy]?.toLowerCase &&
                                                                    b[measureSortBy]?.toLowerCase
                                                                ) {
                                                                    return a[measureSortBy].toLowerCase() >
                                                                        b[measureSortBy].toLowerCase()
                                                                        ? -1
                                                                        : 1;
                                                                } else {
                                                                    return a[measureSortBy] > b[measureSortBy] ? -1 : 1;
                                                                }
                                                            }
                                                        })
                                                        .map((measure, i) => {
                                                            measure = {
                                                                ...measure,
                                                                scheduledAt: new Date(
                                                                    measure.scheduledAt.getTime() -
                                                                        measure.scheduledAt.getTimezoneOffset() *
                                                                            60 *
                                                                            1000
                                                                ),
                                                            };
                                                            const { name, scheduledAt, active, measureImpact } =
                                                                measure;
                                                            return (
                                                                <TableRow
                                                                    key={i}
                                                                    sx={{
                                                                        backgroundColor: "background.mainIntransparent",
                                                                        borderRadius: 5,
                                                                        marginBottom: 1,

                                                                        "&:last-child td, &:last-child th": {
                                                                            border: 0,
                                                                        },
                                                                        "&:hover": {
                                                                            cursor: "pointer",
                                                                            backgroundColor: "#fff !important",
                                                                        },
                                                                    }}
                                                                    onClick={() =>
                                                                        onCLickEditMeasureImpact(
                                                                            threats[selectedThreat],
                                                                            measureImpact
                                                                        )
                                                                    }
                                                                    hover
                                                                >
                                                                    <CustomTableCell
                                                                        showBorder={true}
                                                                        sx={{
                                                                            borderRight: "#fff",
                                                                            padding: 0,
                                                                            paddingLeft: 1,
                                                                            paddingTop: 0.5,
                                                                            verticalAlign: "center",
                                                                            borderRightColor: "#fff",
                                                                        }}
                                                                    >
                                                                        {active && (
                                                                            <Tooltip title={t("activeTooltip")}>
                                                                                <EventAvailable
                                                                                    sx={{
                                                                                        fontSize: 20,
                                                                                    }}
                                                                                />
                                                                            </Tooltip>
                                                                        )}

                                                                        {scheduledAt && !active && (
                                                                            <Tooltip title={t("scheduledTooltip")}>
                                                                                <CalendarToday
                                                                                    sx={{
                                                                                        fontSize: 18,
                                                                                    }}
                                                                                />
                                                                            </Tooltip>
                                                                        )}
                                                                    </CustomTableCell>
                                                                    <CustomTableCell
                                                                        scope="row"
                                                                        showBorder={true}
                                                                        sx={{
                                                                            position: "relative",
                                                                            borderRightColor: "#fff",
                                                                        }}
                                                                        align={"left"}
                                                                    >
                                                                        <Typography
                                                                            onClick={(e) =>
                                                                                onClickEditAppliedMeasure(e, measure)
                                                                            }
                                                                            sx={{
                                                                                display: "inline",
                                                                                fontWeight: "bold",
                                                                                fontSize: "0.875rem",
                                                                                "&:hover": {
                                                                                    textDecoration: "underline",
                                                                                },
                                                                            }}
                                                                        >
                                                                            {name}
                                                                        </Typography>
                                                                    </CustomTableCell>
                                                                    <CustomTableCell
                                                                        showBorder={true}
                                                                        sx={{
                                                                            borderRightColor: "#fff",
                                                                        }}
                                                                    >
                                                                        <Typography
                                                                            sx={{
                                                                                fontSize: "0.875rem",
                                                                            }}
                                                                        >
                                                                            {scheduledAt
                                                                                ? scheduledAt
                                                                                      .toISOString()
                                                                                      .split("T")[0]
                                                                                : t("notScheduledYet")}
                                                                        </Typography>
                                                                    </CustomTableCell>
                                                                    <CustomTableCell
                                                                        sx={{
                                                                            padding: 0,
                                                                        }}
                                                                        alignItems={"left"}
                                                                    >
                                                                        {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                                                                            <Box>
                                                                                <IconButton
                                                                                    disabled={!scheduledAt}
                                                                                    title={t("unapplyMeasure")}
                                                                                    onClick={(e) =>
                                                                                        onClickDeleteMeasureImpact(
                                                                                            e,
                                                                                            name,
                                                                                            threats[selectedThreat]
                                                                                                .name,
                                                                                            measureImpact
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    <Delete
                                                                                        sx={{
                                                                                            fontSize: 18,
                                                                                        }}
                                                                                    />
                                                                                </IconButton>
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
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
            {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                <Routes>
                    <Route path="measures/add" element={<AddMeasureDialogPage />} />
                    <Route path="measureImpacts/edit" element={<MeasureImpactByMeasureDialogPage />} />
                    <Route path="threats/edit" element={<ThreatDialogPage />} />
                    <Route path="appliedMeasure/edit" element={<MeasureDetailsDialogPage />} />
                </Routes>
            )}
        </Page>
    );
};

const ThreatTableHeaderCell = ({
    name,
    children,
    sx,
    labelBoxSX = {},
    sortBy = null,
    sortDirection,
    onClick,
    showBorder = false,
    ...props
}) => {
    const active = sortBy === name;

    const backgroundColor = active && sortBy ? "table.headerBackgroundSelected" : "table.headerBackground";

    const borderRight = showBorder ? "1.5px solid #00000000" : null;

    const handleOnClick = (e) => {
        if (onClick) {
            onClick(e, name);
        }
    };

    return (
        <TableCell
            onClick={handleOnClick}
            align="center"
            sortDirection={sortDirection}
            sx={{
                fontWeight: "bold",
                fontSize: "0.875rem",
                backgroundColor,
                borderBottomColor: "primary.main",
                borderBottomWidth: "1.5px",
                "&:hover": {
                    cursor: sortBy ? "pointer" : "default",
                    backgroundColor: sortBy ? "primary.light" : "#fff",
                },
                borderRight,
                borderRightColor: "primary.main",
                ...sx,
            }}
            {...props}
        >
            {sortBy && (
                <TableSortLabel active={active} direction={sortDirection}>
                    <Box sx={{ marginLeft: "26px", ...labelBoxSX }}> {children} </Box>
                </TableSortLabel>
            )}

            {!sortBy && <Box sx={{ marginLeft: "26px", ...labelBoxSX }}> {children} </Box>}
        </TableCell>
    );
};

const CustomTableCell = ({ sx, showBorder = false, children, ...props }) => {
    const borderRight = showBorder ? "1.5px solid #00000000" : null;
    return (
        <TableCell
            align="center"
            sx={{
                fontSize: "0.875rem",
                borderRight,
                borderRightColor: "primary.main",
                borderBottomColor: "#fff",
                ...sx,
            }}
            {...props}
        >
            {children}
        </TableCell>
    );
};

export const RiskPage = CreatePage(HeaderNavigation, withProject(RiskPageBody), true);
