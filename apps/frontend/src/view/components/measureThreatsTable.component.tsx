import type { MouseEvent as ReactMouseEvent, SyntheticEvent } from "react";
import TableCell from "@mui/material/TableCell";
import { Box, Table, TableBody, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import type { MeasureImpact } from "#api/types/measure-impact.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { CustomTableHeaderCell } from "../components/table-header.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { IconButton } from "./icon-button.component";
import type { SortDirection } from "#application/actions/list.actions.ts";
import type { MeasureThreat } from "#application/hooks/use-measure-threats-list.hook.ts";

interface MeasureThreatsTableProps {
    measureThreats?: MeasureThreat[];
    sortBy: string;
    onChangeSortBy: (_e: SyntheticEvent, newSortBy: string | null) => void;
    sortDirection: SortDirection;
    userRole: USER_ROLES | undefined;
    onClickDeleteMeasureThreat: (event: ReactMouseEvent<HTMLElement>, measureThreat: MeasureThreat) => void;
    onClickEditMeasureImpact: (event: ReactMouseEvent<HTMLElement>, measureImpact: MeasureImpact) => void;
    onClickEditThreat: (event: ReactMouseEvent<HTMLElement>, threat: ExtendedThreat | undefined) => void;
}

export const MeasureThreatsTable = ({
    measureThreats,
    sortBy,
    onChangeSortBy,
    sortDirection,
    userRole,
    onClickDeleteMeasureThreat,
    onClickEditMeasureImpact,
    onClickEditThreat,
}: MeasureThreatsTableProps) => {
    const { t } = useTranslation("measureDialog");

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
                                    name="threatName"
                                    sortBy={sortBy}
                                    sortDirection={sortDirection}
                                    showBorder={true}
                                    onClick={onChangeSortBy}
                                    data-testid="AssetName"
                                >
                                    {t("threat")}
                                </CustomTableHeaderCell>
                                <CustomTableHeaderCell
                                    name="componentName"
                                    sortBy={sortBy}
                                    sortDirection={sortDirection}
                                    showBorder={true}
                                    onClick={onChangeSortBy}
                                    data-testid="componentName"
                                >
                                    {t("component")}
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
                            {measureThreats === undefined
                                ? null
                                : measureThreats.length === 0 && (
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
                            {measureThreats &&
                                measureThreats.map((measureThreat) => (
                                    <MeasureThreatTableRow
                                        key={measureThreat.measureImpactId}
                                        measureThreat={measureThreat}
                                        userRole={userRole}
                                        onClickEditMeasureImpact={onClickEditMeasureImpact}
                                        onClickDeleteMeasureThreat={onClickDeleteMeasureThreat}
                                        onClickEditThreat={onClickEditThreat}
                                    />
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Box>
    );
};

interface MeasureThreatTableRowProps {
    measureThreat: MeasureThreat;
    onClickDeleteMeasureThreat: (event: ReactMouseEvent<HTMLElement>, measureThreat: MeasureThreat) => void;
    onClickEditMeasureImpact: (event: ReactMouseEvent<HTMLElement>, measureImpact: MeasureImpact) => void;
    userRole: USER_ROLES | undefined;
    onClickEditThreat: (event: ReactMouseEvent<HTMLElement>, threat: ExtendedThreat | undefined) => void;
}

const MeasureThreatTableRow = ({
    measureThreat,
    onClickDeleteMeasureThreat,
    onClickEditMeasureImpact,
    userRole,
    onClickEditThreat,
}: MeasureThreatTableRowProps) => {
    const { threatName, netProbability, netDamage, measureImpact, componentName, setsOutOfScope, threat } =
        measureThreat;

    const { t } = useTranslation("measureDialog");
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
            onClick={(e) => onClickEditMeasureImpact(e, measureImpact)}
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
                onClick={(e) => onClickEditThreat(e, threat)}
            >
                {threatName}
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
                {componentName}
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
                            onClick={(e) => onClickEditMeasureImpact(e, measureImpact)}
                        >
                            <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                            title={t("deleteMeasureImpact")}
                            hoverColor="error"
                            sx={{
                                color: "text.primary",
                            }}
                            onClick={(e) => onClickDeleteMeasureThreat(e, measureThreat)}
                        >
                            <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                )}
            </TableCell>
        </TableRow>
    );
};
