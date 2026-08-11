import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import Delete from "@mui/icons-material/Delete";
import Replay from "@mui/icons-material/Replay";
import { Box, Typography } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Measure } from "#api/types/measure.types.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { IconButton } from "#view/components/icon-button.component.tsx";
import { ColumnFilterHeader } from "#view/components/column-filter-header.component.tsx";

interface ColumnConfig {
    t: TFunction;
    tCommon: TFunction;
    userRole: USER_ROLES | undefined;
    columnFilters: Record<string, string>;
    handleFilterChange: (field: string, value: string) => void;
    expandedFilters: Record<string, boolean>;
    toggleFilterExpanded: (field: string) => void;
    handleDuplicateMeasure: (measure: Measure) => void;
    handleDeleteOrResetMeasure: (measure: Measure) => void;
}

export const createMeasuresColumns = ({
    t,
    tCommon,
    userRole,
    columnFilters,
    handleFilterChange,
    expandedFilters,
    toggleFilterExpanded,
    handleDuplicateMeasure,
    handleDeleteOrResetMeasure,
}: ColumnConfig): GridColDef[] => [
    {
        field: "name",
        headerName: tCommon("name"),
        flex: 1,
        minWidth: 200,
        align: "left",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="name"
                label={tCommon("name")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
    },
    {
        field: "scheduledAt",
        headerName: tCommon("scheduledAt"),
        flex: 1,
        minWidth: 200,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="scheduledAt"
                label={tCommon("scheduledAt")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
        valueGetter: (value: string | null | undefined) => value || tCommon("notScheduledYet"),
    },
    ...(checkUserRole(userRole, USER_ROLES.EDITOR)
        ? ([
              {
                  field: "actions" as const,
                  headerName: "",
                  width: 120,
                  sortable: false,
                  filterable: false,
                  align: "right" as const,
                  headerAlign: "center" as const,
                  renderHeader: () => (
                      <Box sx={{ width: "100%" }}>
                          <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }} />
                      </Box>
                  ),
                  renderCell: (params: GridRenderCellParams<Measure>) => {
                      const measure = params.row;
                      const isCatalogMeasure = measure.catalogMeasureId != null;

                      return (
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
                                  title={tCommon("copy")}
                                  data-testid="measures-page_measures-list-entry_copy-button"
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateMeasure(measure);
                                  }}
                              >
                                  <ContentCopyOutlined sx={{ fontSize: 18 }} />
                              </IconButton>
                              {isCatalogMeasure ? (
                                  <IconButton
                                      title={tCommon("reset")}
                                      disabled={!measure.scheduledAt}
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteOrResetMeasure(measure);
                                      }}
                                  >
                                      <Replay sx={{ fontSize: 18 }} />
                                  </IconButton>
                              ) : (
                                  <IconButton
                                      title={t("delete")}
                                      hoverColor="error"
                                      data-testid="measures-page_measures-list-entry_delete-button"
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteOrResetMeasure(measure);
                                      }}
                                  >
                                      <Delete sx={{ fontSize: 18 }} />
                                  </IconButton>
                              )}
                          </Box>
                      );
                  },
              },
          ] as GridColDef[])
        : []),
];
