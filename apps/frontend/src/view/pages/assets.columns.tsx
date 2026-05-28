import { Delete, ExpandMore } from "@mui/icons-material";
import { Box, Collapse, IconButton as MuiIconButton, TextField, Typography } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Asset } from "#api/types/asset.types.ts";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { IconButton } from "../components/icon-button.component";

interface ColumnConfig {
    t: TFunction;
    userRole: USER_ROLES | undefined;
    columnFilters: Record<string, string>;
    handleFilterChange: (field: string, value: string) => void;
    expandedFilters: Record<string, boolean>;
    toggleFilterExpanded: (field: string) => void;
    handleDeleteAsset: (asset: Asset) => void;
}

const createFilterHeader = (
    field: string,
    label: string,
    columnFilters: Record<string, string>,
    handleFilterChange: (field: string, value: string) => void,
    expandedFilters: Record<string, boolean>,
    toggleFilterExpanded: (field: string) => void
) => (
    <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
            <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>{label}</Typography>
            <MuiIconButton
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFilterExpanded(field);
                }}
                sx={{
                    ml: 0.5,
                    padding: 0.25,
                    transform: expandedFilters[field] ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                }}
            >
                <ExpandMore sx={{ fontSize: 18 }} />
            </MuiIconButton>
        </Box>
        <Collapse in={expandedFilters[field] ?? false} timeout={200}>
            <TextField
                size="small"
                placeholder="Filter..."
                value={columnFilters[field] || ""}
                onChange={(e) => handleFilterChange(field, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                sx={{ width: "100%" }}
            />
        </Collapse>
    </Box>
);

export const createAssetsColumns = ({
    t,
    userRole,
    columnFilters,
    handleFilterChange,
    expandedFilters,
    toggleFilterExpanded,
    handleDeleteAsset,
}: ColumnConfig): GridColDef[] => [
    {
        field: "name",
        headerName: t("name"),
        flex: 1,
        minWidth: 200,
        align: "left",
        headerAlign: "center",
        renderHeader: () =>
            createFilterHeader(
                "name",
                t("name"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
    },
    {
        field: "confidentiality",
        headerName: t("confidentiality"),
        flex: 1,
        minWidth: 160,
        align: "center",
        headerAlign: "center",
        type: "number",
        renderHeader: () =>
            createFilterHeader(
                "confidentiality",
                t("confidentiality"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
    },
    {
        field: "integrity",
        headerName: t("integrity"),
        flex: 1,
        minWidth: 160,
        align: "center",
        headerAlign: "center",
        type: "number",
        renderHeader: () =>
            createFilterHeader(
                "integrity",
                t("integrity"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
    },
    {
        field: "availability",
        headerName: t("availability"),
        flex: 1,
        minWidth: 160,
        align: "center",
        headerAlign: "center",
        type: "number",
        renderHeader: () =>
            createFilterHeader(
                "availability",
                t("availability"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
    },
    {
        field: "createdAt",
        headerName: t("creationDate"),
        flex: 1,
        minWidth: 180,
        align: "center",
        headerAlign: "center",
        renderHeader: () =>
            createFilterHeader(
                "createdAt",
                t("creationDate"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
        valueGetter: (value: Date | string) => {
            const date = value instanceof Date ? value : new Date(value);
            return date.toISOString().split("T")[0];
        },
    },
    ...(checkUserRole(userRole, USER_ROLES.EDITOR)
        ? ([
              {
                  field: "actions" as const,
                  headerName: "",
                  width: 80,
                  sortable: false,
                  filterable: false,
                  align: "right" as const,
                  headerAlign: "center" as const,
                  renderHeader: () => (
                      <Box sx={{ width: "100%" }}>
                          <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }} />
                      </Box>
                  ),
                  renderCell: (params: GridRenderCellParams<Asset>) => (
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
                              title={t("deleteAsset")}
                              hoverColor="error"
                              data-testid="assets-page_assets-list-entry_delete-button"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAsset(params.row);
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
