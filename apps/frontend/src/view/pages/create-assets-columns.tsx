import Delete from "@mui/icons-material/Delete";
import { Box, Typography } from "@mui/material";
import { type GridColDef, type GridFilterOperator, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Asset } from "#api/types/asset.types.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { IconButton } from "#view/components/icon-button.component.tsx";
import { ColumnFilterHeader } from "#view/components/column-filter-header.component.tsx";

// Numeric columns don't support the "contains" operator the column filter
// headers emit — without this the grid throws as soon as a value is typed.
export const containsNumberOperator: GridFilterOperator = {
    label: "Contains",
    value: "contains",
    getApplyFilterFn: (filterItem) => {
        const needle = String(filterItem.value ?? "").trim();
        if (needle === "") {
            return null;
        }
        return (value) => value != null && String(value).includes(needle);
    },
};

interface ColumnConfig {
    t: TFunction;
    userRole: USER_ROLES | undefined;
    columnFilters: Record<string, string>;
    handleFilterChange: (field: string, value: string) => void;
    expandedFilters: Record<string, boolean>;
    toggleFilterExpanded: (field: string) => void;
    handleDeleteAsset: (asset: Asset) => void;
}

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
        field: "confidentiality",
        headerName: t("confidentiality"),
        flex: 1,
        minWidth: 160,
        align: "center",
        headerAlign: "center",
        type: "number",
        filterOperators: [containsNumberOperator],
        renderHeader: () => (
            <ColumnFilterHeader
                field="confidentiality"
                label={t("confidentiality")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
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
        filterOperators: [containsNumberOperator],
        renderHeader: () => (
            <ColumnFilterHeader
                field="integrity"
                label={t("integrity")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
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
        filterOperators: [containsNumberOperator],
        renderHeader: () => (
            <ColumnFilterHeader
                field="availability"
                label={t("availability")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
    },
    {
        field: "createdAt",
        headerName: t("creationDate"),
        flex: 1,
        minWidth: 180,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="createdAt"
                label={t("creationDate")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
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
