import { Check, Clear, ContentCopy, Delete, ExpandMore } from "@mui/icons-material";
import { Box, TextField, Typography, IconButton as MuiIconButton, Collapse } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import type { ThreatListItem } from "../../application/hooks/use-threats-list.hook";
import { IconButton } from "../components/icon-button.component";

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
            <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                        {t("name")}
                    </Typography>
                    <MuiIconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpanded("name");
                        }}
                        sx={{
                            ml: 0.5,
                            padding: 0.25,
                            transform: expandedFilters["name"] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <ExpandMore sx={{ fontSize: 18 }} />
                    </MuiIconButton>
                </Box>
                <Collapse in={expandedFilters["name"] ?? false} timeout={200}>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={columnFilters["name"] || ""}
                        onChange={(e) => handleFilterChange("name", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                </Collapse>
            </Box>
        ),
    },
    {
        field: "assets",
        headerName: t("assets"),
        width: 140,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                        {t("assets")}
                    </Typography>
                    <MuiIconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpanded("assets");
                        }}
                        sx={{
                            ml: 0.5,
                            padding: 0.25,
                            transform: expandedFilters["assets"] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <ExpandMore sx={{ fontSize: 18 }} />
                    </MuiIconButton>
                </Box>
                <Collapse in={expandedFilters["assets"] ?? false} timeout={200}>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={columnFilters["assets"] || ""}
                        onChange={(e) => handleFilterChange("assets", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                </Collapse>
            </Box>
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
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                        {t("componentName")}
                    </Typography>
                    <MuiIconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpanded("componentName");
                        }}
                        sx={{
                            ml: 0.5,
                            padding: 0.25,
                            transform: expandedFilters["componentName"] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <ExpandMore sx={{ fontSize: 18 }} />
                    </MuiIconButton>
                </Box>
                <Collapse in={expandedFilters["componentName"] ?? false} timeout={200}>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={columnFilters["componentName"] || ""}
                        onChange={(e) => handleFilterChange("componentName", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                </Collapse>
            </Box>
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
        minWidth: 150,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                        {t("pointOfAttack")}
                    </Typography>
                    <MuiIconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpanded("pointOfAttack");
                        }}
                        sx={{
                            ml: 0.5,
                            padding: 0.25,
                            transform: expandedFilters["pointOfAttack"] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <ExpandMore sx={{ fontSize: 18 }} />
                    </MuiIconButton>
                </Box>
                <Collapse in={expandedFilters["pointOfAttack"] ?? false} timeout={200}>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={columnFilters["pointOfAttack"] || ""}
                        onChange={(e) => handleFilterChange("pointOfAttack", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                </Collapse>
            </Box>
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
            <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                        {t("attacker")}
                    </Typography>
                    <MuiIconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpanded("attacker");
                        }}
                        sx={{
                            ml: 0.5,
                            padding: 0.25,
                            transform: expandedFilters["attacker"] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <ExpandMore sx={{ fontSize: 18 }} />
                    </MuiIconButton>
                </Box>
                <Collapse in={expandedFilters["attacker"] ?? false} timeout={200}>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={columnFilters["attacker"] || ""}
                        onChange={(e) => handleFilterChange("attacker", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                </Collapse>
            </Box>
        ),
        valueGetter: (value: string) => t(`attackerList.${value}`),
    },
    {
        field: "probability",
        headerName: t("probability"),
        width: 160,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                        {t("probability")}
                    </Typography>
                    <MuiIconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpanded("probability");
                        }}
                        sx={{
                            ml: 0.5,
                            padding: 0.25,
                            transform: expandedFilters["probability"] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <ExpandMore sx={{ fontSize: 18 }} />
                    </MuiIconButton>
                </Box>
                <Collapse in={expandedFilters["probability"] ?? false} timeout={200}>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={columnFilters["probability"] || ""}
                        onChange={(e) => handleFilterChange("probability", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                </Collapse>
            </Box>
        ),
    },
    {
        field: "damage",
        headerName: t("damage"),
        width: 150,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                        {t("damage")}
                    </Typography>
                    <MuiIconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpanded("damage");
                        }}
                        sx={{
                            ml: 0.5,
                            padding: 0.25,
                            transform: expandedFilters["damage"] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <ExpandMore sx={{ fontSize: 18 }} />
                    </MuiIconButton>
                </Box>
                <Collapse in={expandedFilters["damage"] ?? false} timeout={200}>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={columnFilters["damage"] || ""}
                        onChange={(e) => handleFilterChange("damage", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                </Collapse>
            </Box>
        ),
    },
    {
        field: "risk",
        headerName: t("risk"),
        width: 120,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <Box sx={{ width: "100%" }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                    <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                        {t("risk")}
                    </Typography>
                    <MuiIconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFilterExpanded("risk");
                        }}
                        sx={{
                            ml: 0.5,
                            padding: 0.25,
                            transform: expandedFilters["risk"] ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                        }}
                    >
                        <ExpandMore sx={{ fontSize: 18 }} />
                    </MuiIconButton>
                </Box>
                <Collapse in={expandedFilters["risk"] ?? false} timeout={200}>
                    <TextField
                        size="small"
                        placeholder="Filter..."
                        value={columnFilters["risk"] || ""}
                        onChange={(e) => handleFilterChange("risk", e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                </Collapse>
            </Box>
        ),
    },
    {
        field: "doneEditing",
        headerName: t("edited"),
        width: 150,
        align: "center",
        headerAlign: "center",
        sortable: false,
        filterable: false,
        renderHeader: () => (
            <Box sx={{ width: "100%" }}>
                <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>
                    {t("edited")}
                </Typography>
            </Box>
        ),
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
                      <Box sx={{ display: "flex", paddingRight: 2, paddingLeft: 2 }}>
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
