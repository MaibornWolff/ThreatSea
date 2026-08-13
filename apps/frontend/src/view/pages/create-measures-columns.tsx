import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import Delete from "@mui/icons-material/Delete";
import Replay from "@mui/icons-material/Replay";
import { Box } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Measure } from "#api/types/measure.types.ts";
import { checkUserRole, USER_ROLES } from "#api/types/user-roles.types.ts";
import { IconButton } from "#view/components/icon-button.component.tsx";
import { ColumnFilterHeader } from "#view/components/column-filter-header.component.tsx";
import { OverflowText } from "#view/components/overflow-text.component.tsx";

interface ColumnConfig {
    t: TFunction;
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
        renderCell: ({ row }: GridRenderCellParams<Measure>) => (
            <OverflowText text={row.name} testId="measures-page_measures-list-entry_name" />
        ),
    },
    {
        field: "scheduledAt",
        headerName: t("scheduledAt"),
        flex: 1,
        minWidth: 200,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="scheduledAt"
                label={t("scheduledAt")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
        valueGetter: (value: string | null | undefined) => value || t("notScheduledYet"),
        renderCell: ({ value }: GridRenderCellParams<Measure>) => (
            <span data-testid="measures-page_measures-list-entry_scheduled-at">{value}</span>
        ),
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
                                  title={t("copy")}
                                  data-testid="measures-page_measures-list-entry_copy-button"
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicateMeasure(measure);
                                  }}
                              >
                                  <ContentCopyOutlined sx={{ fontSize: 18 }} />
                              </IconButton>
                              {isCatalogMeasure ? (
                                  // The span keeps the tooltip working while the button is
                                  // disabled (disabled MUI buttons fire no pointer events).
                                  <span>
                                      <IconButton
                                          title={t("reset")}
                                          disabled={!measure.scheduledAt}
                                          data-testid="measures-page_measures-list-entry_reset-button"
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteOrResetMeasure(measure);
                                          }}
                                      >
                                          <Replay sx={{ fontSize: 18 }} />
                                      </IconButton>
                                  </span>
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
