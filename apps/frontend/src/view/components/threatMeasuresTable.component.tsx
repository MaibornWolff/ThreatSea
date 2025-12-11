import { Box, Table, TableBody, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import TableCell from "@mui/material/TableCell";
import type { MouseEvent as ReactMouseEvent, SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ThreatMeasure } from "#application/hooks/use-threat-measures-list.hook.ts";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { Measure } from "#api/types/measure.types.ts";
import type { ExtendedProject } from "#api/types/project.types.ts";
import type { SortDirection } from "#application/actions/list.actions.ts";
import { CustomTableHeaderCell } from "./table-header.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { IconButton } from "./icon-button.component";

interface ThreatMeasuresTableSharedProps {
    onClickDeleteMeasureThreat: (
        event: ReactMouseEvent<HTMLElement>,
        threatMeasure: ThreatMeasure,
        measure: Measure
    ) => void;
    onClickEditMeasureImpact: (
        event: ReactMouseEvent<HTMLElement>,
        measureImpact: MeasureImpact,
        measure: Measure
    ) => void;
    userRole: USER_ROLES | undefined;
    project: ExtendedProject;
    onClickEditMeasure: (event: ReactMouseEvent<HTMLElement>, project: ExtendedProject, measure: Measure) => void;
}

interface ThreatMeasuresTableProps extends ThreatMeasuresTableSharedProps {
    threatMeasures?: ThreatMeasure[];
    sortBy: string;
    sortDirection: SortDirection;
    onChangeSortBy: (event: SyntheticEvent, name: string | null) => void;
}

interface ThreatMeasuresTableRowProps extends ThreatMeasuresTableSharedProps {
    threatMeasure: ThreatMeasure;
}

export const ThreatMeasuresTable = ({
    threatMeasures,
    sortBy,
    onChangeSortBy,
    sortDirection,
    userRole,
    project,
    onClickEditMeasureImpact,
    onClickDeleteMeasureThreat,
    onClickEditMeasure,
}: ThreatMeasuresTableProps) => {
    const { t } = useTranslation("threatDialogPage");

    return (
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
                }}
            >
                <TableContainer
                    sx={{
                        maxHeight: 600,
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
                                    name="measureName"
                                    sortBy={sortBy}
                                    sortDirection={sortDirection}
                                    showBorder={true}
                                    onClick={onChangeSortBy}
                                    data-testid="AssetName"
                                >
                                    {t("measure")}
                                </CustomTableHeaderCell>
                                <CustomTableHeaderCell
                                    name="measureScheduleAt"
                                    sortBy={sortBy}
                                    sortDirection={sortDirection}
                                    showBorder={true}
                                    onClick={onChangeSortBy}
                                    data-testid="measureScheduleAt"
                                >
                                    {t("scheduledAt")}
                                </CustomTableHeaderCell>
                                <CustomTableHeaderCell
                                    name="netProbability"
                                    sortBy={sortBy}
                                    sortDirection={sortDirection}
                                    showBorder={true}
                                    onClick={onChangeSortBy}
                                >
                                    {t("netProbability")}
                                </CustomTableHeaderCell>

                                <CustomTableHeaderCell
                                    name="netDamage"
                                    sortBy={sortBy}
                                    sortDirection={sortDirection}
                                    showBorder={true}
                                    onClick={onChangeSortBy}
                                >
                                    {t("netDamage")}
                                </CustomTableHeaderCell>

                                <CustomTableHeaderCell></CustomTableHeaderCell>
                            </TableRow>
                        </TableHead>
                        <TableBody data-testid="AssetsBody">
                            {(!threatMeasures || threatMeasures.length === 0) && (
                                <Typography
                                    sx={{
                                        paddingTop: 2,
                                        paddingLeft: 2,
                                        minHeight: 60,
                                        fontSize: "0.75rem",
                                        fontStyle: "italic",
                                    }}
                                >
                                    {t("noThreatsFound")}
                                </Typography>
                            )}
                            {threatMeasures?.map((threatMeasure) => (
                                <ThreatMeasuresTableRow
                                    key={threatMeasure.measureImpactId}
                                    threatMeasure={threatMeasure}
                                    userRole={userRole}
                                    project={project}
                                    onClickEditMeasureImpact={onClickEditMeasureImpact}
                                    onClickDeleteMeasureThreat={onClickDeleteMeasureThreat}
                                    onClickEditMeasure={onClickEditMeasure}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

const ThreatMeasuresTableRow = ({
    threatMeasure,
    onClickDeleteMeasureThreat,
    onClickEditMeasureImpact,
    userRole,
    project,
    onClickEditMeasure,
}: ThreatMeasuresTableRowProps) => {
    const { measureName, netProbability, netDamage, measureImpact, measureScheduleAt, setsOutOfScope, measure } =
        threatMeasure;

    const { t } = useTranslation("threatDialogPage");
    return (
        <TableRow
            sx={{
                backgroundColor: "background.mainIntransparent",
                borderRadius: 5,
                marginBottom: 1,

                "&:last-child td, &:last-child th": { borderBottom: 0 },
                "&:hover": {
                    cursor: "pointer",
                    backgroundColor: "#ffffff !important",
                },
            }}
            onClick={(e) => onClickEditMeasureImpact(e, measureImpact, measure)}
        >
            <TableCell
                scope="row"
                sx={{
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                    borderBottomColor: "#fff",
                    borderRight: "1.5px solid",
                    borderRightColor: "#fff",
                    maxWidth: 250,
                    overflow: "clip",
                    "&:hover": {
                        textDecoration: "underline",
                    },
                }}
                onClick={(e) => onClickEditMeasure(e, project, measure)}
            >
                {measureName}
            </TableCell>
            <TableCell
                align="center"
                sx={{
                    borderBottomColor: "#fff",
                    borderRight: "1.5px solid",
                    borderRightColor: "#fff",
                    fontSize: "0.875rem",
                }}
            >
                {measureScheduleAt ? measureScheduleAt.toISOString().split("T")[0] : t("notScheduledYet")}
            </TableCell>
            {setsOutOfScope && (
                <TableCell
                    align="center"
                    colSpan={2}
                    sx={{
                        borderBottomColor: "#fff",
                        borderRight: "1.5px solid",
                        borderRightColor: "#fff",
                        fontSize: "0.875rem",
                    }}
                >
                    {t("setsOutOfScope")}
                </TableCell>
            )}
            {!setsOutOfScope && [
                <TableCell
                    key="net-probability"
                    align="center"
                    sx={{
                        borderBottomColor: "#fff",
                        borderRight: "1.5px solid",
                        borderRightColor: "#fff",
                        fontSize: "0.875rem",
                    }}
                >
                    {netProbability == null ? t("noImpact") : netProbability}
                </TableCell>,
                <TableCell
                    key="net-damage"
                    align="center"
                    sx={{
                        borderBottomColor: "#fff",
                        borderRight: "1.5px solid",
                        borderRightColor: "#fff",
                        fontSize: "0.875rem",
                    }}
                >
                    {netDamage == null ? t("noImpact") : netDamage}
                </TableCell>,
            ]}
            <TableCell
                align="right"
                data-testid="DeleteMeasureImpact"
                sx={{
                    padding: 0,
                    paddingRight: 1.5,
                    borderBottomColor: "#fff",
                }}
            >
                {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                    <Box>
                        <IconButton
                            title={t("editMeasureImpact")}
                            sx={{
                                color: "text.primary",
                            }}
                            onClick={(e) => onClickEditMeasureImpact(e, measureImpact, measure)}
                        >
                            <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                            title={t("deleteMeasureImpact")}
                            hoverColor="error"
                            sx={{
                                color: "text.primary",
                            }}
                            onClick={(e) => onClickDeleteMeasureThreat(e, threatMeasure, measure)}
                        >
                            <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                )}
            </TableCell>
        </TableRow>
    );
};
