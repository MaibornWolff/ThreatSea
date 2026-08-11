import Check from "@mui/icons-material/Check";
import Clear from "@mui/icons-material/Clear";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Delete from "@mui/icons-material/Delete";
import { Box, MenuItem, Select, Typography } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import type { ThreatListItem } from "#application/hooks/use-threats-list.hook.ts";
import { IconButton } from "#view/components/icon-button.component.tsx";
import { ColumnFilterHeader } from "#view/components/column-filter-header.component.tsx";

interface ColumnConfig {
    t: TFunction;
    userRole: USER_ROLES | undefined;
    columnFilters: Record<string, string>;
    handleFilterChange: (field: string, value: string) => void;
    handleAssetHover: (event: React.MouseEvent<HTMLElement>, assets: ExtendedThreat["assets"]) => void;
    setAssetAnchorEl: (el: HTMLElement | null) => void;
    handleDuplicateThreat: (threat: ThreatListItem) => void;
    handleDeleteThreat: (threat: ThreatListItem) => void;
    expandedFilters: Record<string, boolean>;
    toggleFilterExpanded: (field: string) => void;
}

export const createThreatsColumns = ({
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
}: ColumnConfig): GridColDef[] => [
    {
        field: "name",
        headerName: t("name"),
        flex: 1,
        minWidth: 150,
        align: "left",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="name"
                label={t("name")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
    },
    {
        field: "assets",
        headerName: t("assets"),
        width: 140,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="assets"
                label={t("assets")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
        valueGetter: (_value, row) => row.assets.length,
        renderCell: (params: GridRenderCellParams<ThreatListItem>) => (
            <span
                onMouseEnter={(e) => handleAssetHover(e, params.row.assets)}
                onMouseLeave={() => setAssetAnchorEl(null)}
                style={{ display: "block", width: "100%", height: "100%" }}
            >
                {params.row.assets.length}
            </span>
        ),
    },
    {
        field: "componentName",
        headerName: t("componentName"),
        flex: 1,
        minWidth: 170,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="componentName"
                label={t("componentName")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
        valueGetter: (_value, row) => {
            if (row.pointOfAttack === "COMMUNICATION_INTERFACES") {
                return `${row.componentName || t("unknown")} > ${row.interfaceName}`;
            }
            return row.componentName;
        },
    },
    {
        field: "pointOfAttack",
        headerName: t("pointOfAttack"),
        flex: 1,
        minWidth: 200,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="pointOfAttack"
                label={t("pointOfAttack")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
        valueGetter: (value: string) => t(`pointsOfAttackList.${value}`),
    },
    {
        field: "attacker",
        headerName: t("attacker"),
        flex: 1,
        minWidth: 140,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="attacker"
                label={t("attacker")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
        valueGetter: (value: string) => t(`attackerList.${value}`),
    },
    {
        field: "probability",
        headerName: t("probability"),
        width: 200,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="probability"
                label={t("probability")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
    },
    {
        field: "damage",
        headerName: t("damage"),
        width: 150,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="damage"
                label={t("damage")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
    },
    {
        field: "risk",
        headerName: t("risk"),
        width: 140,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="risk"
                label={t("risk")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
    },
    {
        field: "doneEditing",
        headerName: t("edited"),
        width: 180,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="doneEditing"
                label={t("edited")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            >
                <Select
                    size="small"
                    value={columnFilters["doneEditing"] || ""}
                    onChange={(event) => handleFilterChange("doneEditing", event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                    displayEmpty
                    sx={{ width: "100%" }}
                >
                    <MenuItem value="">{t("filterAll")}</MenuItem>
                    <MenuItem value="edited">{t("edited")}</MenuItem>
                    <MenuItem value="notEdited">{t("notEdited")}</MenuItem>
                </Select>
            </ColumnFilterHeader>
        ),
        valueGetter: (_value, row) => (row.doneEditing ? "edited" : "notEdited"),
        renderCell: (params: GridRenderCellParams<ThreatListItem>) => (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                {params.row.doneEditing ? <Check sx={{ fontSize: 18 }} /> : <Clear sx={{ fontSize: 18 }} />}
            </Box>
        ),
    },
    ...(checkUserRole(userRole, USER_ROLES.EDITOR)
        ? ([
              {
                  field: "actions" as const,
                  headerName: "",
                  width: 100,
                  sortable: false,
                  filterable: false,
                  align: "right" as const,
                  headerAlign: "center" as const,
                  renderHeader: () => (
                      <Box sx={{ width: "100%" }}>
                          <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }} />
                      </Box>
                  ),
                  renderCell: (params: GridRenderCellParams<ThreatListItem>) => (
                      <Box
                          sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              height: "100%",
                              paddingRight: 2,
                              paddingLeft: 2,
                          }}
                      >
                          <IconButton
                              title={t("duplicateThreat")}
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateThreat(params.row);
                              }}
                          >
                              <ContentCopy sx={{ fontSize: 18 }} />
                          </IconButton>
                          <IconButton
                              title={t("deleteThreat")}
                              hoverColor="error"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteThreat(params.row);
                              }}
                          >
                              <Delete sx={{ fontSize: 18 }} />
                          </IconButton>
                      </Box>
                  ),
              },
          ] as GridColDef[])
        : []),
];
