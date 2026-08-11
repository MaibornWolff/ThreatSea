import Add from "@mui/icons-material/Add";
import Block from "@mui/icons-material/Block";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import { Box, MenuItem, Select, Typography } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { GenericThreatWithExtendedChildren } from "#api/types/generic-threat.types.ts";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import type { ExtendedThreatWithMetrics } from "#application/hooks/use-generic-threats-list.hook.ts";
import { ColumnFilterHeader } from "#view/components/column-filter-header.component.tsx";
import { IconButton } from "#view/components/icon-button.component.tsx";

export type ThreatsGridRow =
    | {
          rowType: "genericThreat";
          rowId: string;
          genericThreat: GenericThreatWithExtendedChildren;
          childCount: number;
          isExpanded: boolean;
      }
    | { rowType: "threat"; rowId: string; threat: ExtendedThreatWithMetrics }
    | { rowType: "emptyChildren"; rowId: string };

export const GENERIC_THREAT_ROW_PREFIX = "generic-";
export const THREAT_ROW_PREFIX = "threat-";

export const formatComponentName = (
    entity: Pick<GenericThreatWithExtendedChildren, "pointOfAttack" | "componentName" | "interfaceName">,
    t: TFunction
): string => {
    if (entity.pointOfAttack === "COMMUNICATION_INTERFACES") {
        return `${entity.componentName || t("unknown")}${entity.interfaceName ? ` > ${entity.interfaceName}` : ""}`;
    }
    return entity.componentName ?? "";
};

interface ColumnConfig {
    t: TFunction;
    userRole: USER_ROLES | undefined;
    columnFilters: Record<string, string>;
    onFilterChange: (field: string, value: string) => void;
    expandedFilters: Record<string, boolean>;
    onToggleFilterExpanded: (field: string) => void;
    onToggleGenericThreat: (genericThreatId: number) => void;
    onAssetHover: (event: React.MouseEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => void;
    onAssetHoverEnd: () => void;
    onAddThreat: (event: React.MouseEvent<HTMLElement>, genericThreat: GenericThreatWithExtendedChildren) => void;
    onEditThreat: (event: React.MouseEvent<HTMLElement>, threat: ExtendedThreat) => void;
    onDuplicateThreat: (event: React.MouseEvent<HTMLElement>, threat: ExtendedThreatWithMetrics) => void;
    onDeleteThreat: (event: React.MouseEvent<HTMLElement>, threat: ExtendedThreatWithMetrics) => void;
}

const cellText = { fontSize: "0.875rem" } as const;

const threatStatusPresentation: Record<THREAT_STATUSES, { icon: React.ReactElement; color: string }> = {
    [THREAT_STATUSES.NEW]: { icon: <FiberManualRecord sx={{ fontSize: 16 }} />, color: "primary.main" },
    [THREAT_STATUSES.IN_PROGRESS]: { icon: <Edit sx={{ fontSize: 16 }} />, color: "secondary.main" },
    [THREAT_STATUSES.FINALIZED]: { icon: <CheckCircle sx={{ fontSize: 16 }} />, color: "success.main" },
    [THREAT_STATUSES.OUTOFSCOPE]: { icon: <Block sx={{ fontSize: 16 }} />, color: "text.disabled" },
};

export const createThreatsColumns = ({
    t,
    userRole,
    columnFilters,
    onFilterChange,
    expandedFilters,
    onToggleFilterExpanded,
    onToggleGenericThreat,
    onAssetHover,
    onAssetHoverEnd,
    onAddThreat,
    onEditThreat,
    onDuplicateThreat,
    onDeleteThreat,
}: ColumnConfig): GridColDef<ThreatsGridRow>[] => [
    {
        field: "name",
        headerName: t("name"),
        flex: 1.4,
        minWidth: 220,
        sortable: false,
        align: "left",
        headerAlign: "center",
        colSpan: (_value, row) => (row.rowType === "emptyChildren" ? 10 : undefined),
        renderHeader: () => (
            <ColumnFilterHeader
                field="name"
                label={t("name")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            />
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return (
                    <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                        <IconButton
                            title={row.isExpanded ? "Collapse" : "Expand"}
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleGenericThreat(row.genericThreat.id);
                            }}
                        >
                            {row.isExpanded ? (
                                <ExpandMore sx={{ fontSize: 18 }} />
                            ) : (
                                <ChevronRight sx={{ fontSize: 18 }} />
                            )}
                        </IconButton>
                        <Typography
                            sx={{ ...cellText, fontWeight: "bold" }}
                            data-testid="threats-page_generic-threats-list-entry_name"
                        >
                            {row.genericThreat.name}
                        </Typography>
                    </Box>
                );
            }
            if (row.rowType === "threat") {
                return (
                    <Box sx={{ display: "flex", alignItems: "center", height: "100%", paddingLeft: 5 }}>
                        <Typography sx={cellText} data-testid="threats-page_threats-list-entry_name">
                            {row.threat.name}
                        </Typography>
                    </Box>
                );
            }
            return (
                <Box sx={{ display: "flex", alignItems: "center", height: "100%", paddingLeft: 5 }}>
                    <Typography sx={{ ...cellText, fontStyle: "italic" }}>{t("noChildThreats")}</Typography>
                </Box>
            );
        },
    },
    {
        field: "assets",
        headerName: t("assets"),
        width: 120,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="assets"
                label={t("assets")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            />
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType !== "threat") {
                return row.rowType === "genericThreat" ? "-" : null;
            }
            return (
                <span
                    onMouseEnter={(event) => onAssetHover(event, row.threat.assets)}
                    onMouseLeave={onAssetHoverEnd}
                    style={{ display: "block", width: "100%", height: "100%" }}
                >
                    {row.threat.assets.length}
                </span>
            );
        },
    },
    {
        field: "componentName",
        headerName: t("componentName"),
        flex: 1,
        minWidth: 160,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="componentName"
                label={t("componentName")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            />
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return (
                    <span data-testid="threats-page_generic-threats-list-entry_component">
                        {formatComponentName(row.genericThreat, t)}
                    </span>
                );
            }
            if (row.rowType === "threat") {
                return (
                    <span data-testid="threats-page_threats-list-entry_component">
                        {formatComponentName(row.threat, t)}
                    </span>
                );
            }
            return null;
        },
    },
    {
        field: "pointOfAttack",
        headerName: t("pointOfAttack"),
        flex: 1,
        minWidth: 160,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="pointOfAttack"
                label={t("pointOfAttack")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            />
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return t(`pointsOfAttackList.${row.genericThreat.pointOfAttack}`);
            }
            if (row.rowType === "threat") {
                return t(`pointsOfAttackList.${row.threat.pointOfAttack}`);
            }
            return null;
        },
    },
    {
        field: "attacker",
        headerName: t("attacker"),
        flex: 1,
        minWidth: 150,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="attacker"
                label={t("attacker")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            />
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return t(`attackerList.${row.genericThreat.attacker}`);
            }
            if (row.rowType === "threat") {
                return t(`attackerList.${row.threat.attacker}`);
            }
            return null;
        },
    },
    {
        field: "probability",
        headerName: t("probability"),
        width: 120,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="probability"
                label={t("probability")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            />
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return "-";
            }
            return row.rowType === "threat" ? row.threat.probability : null;
        },
    },
    {
        field: "damage",
        headerName: t("damage"),
        width: 110,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="damage"
                label={t("damage")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            />
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return "-";
            }
            return row.rowType === "threat" ? row.threat.damage : null;
        },
    },
    {
        field: "risk",
        headerName: t("risk"),
        width: 100,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="risk"
                label={t("risk")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            />
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return "-";
            }
            return row.rowType === "threat" ? row.threat.risk : null;
        },
    },
    {
        field: "status",
        headerName: t("status"),
        width: 160,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="status"
                label={t("status")}
                columnFilters={columnFilters}
                onFilterChange={onFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={onToggleFilterExpanded}
            >
                <Select
                    size="small"
                    value={columnFilters["status"] || ""}
                    onChange={(event) => onFilterChange("status", event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    displayEmpty
                    sx={{ width: "100%" }}
                >
                    <MenuItem value="">{t("filterAll")}</MenuItem>
                    {Object.values(THREAT_STATUSES).map((status) => (
                        <MenuItem key={status} value={status}>
                            {t(`statusList.${status}`)}
                        </MenuItem>
                    ))}
                </Select>
            </ColumnFilterHeader>
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return "-";
            }
            if (row.rowType !== "threat") {
                return null;
            }
            const presentation = threatStatusPresentation[row.threat.status];
            return (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        height: "100%",
                        color: presentation.color,
                    }}
                >
                    {presentation.icon}
                    <Typography sx={cellText}>{t(`statusList.${row.threat.status}`)}</Typography>
                </Box>
            );
        },
    },
    {
        field: "actions",
        headerName: t("actions"),
        width: 170,
        sortable: false,
        filterable: false,
        align: "right",
        headerAlign: "center",
        renderHeader: () => (
            <Box sx={{ width: "100%" }}>
                <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }} />
            </Box>
        ),
        renderCell: (params: GridRenderCellParams<ThreatsGridRow>) => {
            const row = params.row;
            if (row.rowType === "genericThreat") {
                return (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: 1,
                            height: "100%",
                            paddingRight: 1,
                        }}
                    >
                        <Typography sx={cellText}>{t("childThreatsCount", { count: row.childCount })}</Typography>
                        {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                            <IconButton
                                title={t("addThreat")}
                                onClick={(event) => onAddThreat(event, row.genericThreat)}
                            >
                                <Add sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                    </Box>
                );
            }
            if (row.rowType !== "threat") {
                return null;
            }
            return (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        height: "100%",
                        paddingRight: 1,
                    }}
                >
                    {checkUserRole(userRole, USER_ROLES.EDITOR) && (
                        <>
                            <IconButton title={t("editThreat")} onClick={(event) => onEditThreat(event, row.threat)}>
                                <Edit sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                                title={t("duplicateThreat")}
                                onClick={(event) => onDuplicateThreat(event, row.threat)}
                            >
                                <ContentCopy sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                                title={t("deleteThreat")}
                                hoverColor="error"
                                onClick={(event) => onDeleteThreat(event, row.threat)}
                            >
                                <Delete sx={{ fontSize: 18 }} />
                            </IconButton>
                        </>
                    )}
                </Box>
            );
        },
    },
];
