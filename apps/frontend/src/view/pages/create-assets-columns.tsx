import Delete from "@mui/icons-material/Delete";
import { Box } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Asset } from "#api/types/asset.types.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { IconButton } from "#view/components/icon-button.component.tsx";
import { ColumnFilterHeader } from "#view/components/column-filter-header.component.tsx";
import { OverflowText } from "#view/components/overflow-text.component.tsx";

export const formatCreationDate = (value: Date | string | null | undefined): string => {
    if (value == null) {
        return "";
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }
    // Local calendar day in YYYY-MM-DD (toISOString would shift to the UTC day).
    return date.toLocaleDateString("sv-SE");
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
        renderCell: ({ row }: GridRenderCellParams<Asset>) => (
            <OverflowText text={row.name} testId="assets-page_assets-list-entry_name" />
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
        renderCell: ({ value }: GridRenderCellParams<Asset>) => (
            <span data-testid="assets-page_assets-list-entry_confidentiality">{value}</span>
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
        renderCell: ({ value }: GridRenderCellParams<Asset>) => (
            <span data-testid="assets-page_assets-list-entry_integrity">{value}</span>
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
        renderCell: ({ value }: GridRenderCellParams<Asset>) => (
            <span data-testid="assets-page_assets-list-entry_availability">{value}</span>
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
        valueGetter: (value: Date | string) => formatCreationDate(value),
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
