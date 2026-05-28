import { ContentCopyOutlined, Delete, ExpandMore, Replay } from "@mui/icons-material";
import { Box, Collapse, IconButton as MuiIconButton, TextField, Typography } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Measure } from "#api/types/measure.types.ts";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import { IconButton } from "../components/icon-button.component";

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
        renderHeader: () =>
            createFilterHeader(
                "name",
                tCommon("name"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
    },
    {
        field: "scheduledAt",
        headerName: tCommon("scheduledAt"),
        flex: 1,
        minWidth: 200,
        align: "center",
        headerAlign: "center",
        renderHeader: () =>
            createFilterHeader(
                "scheduledAt",
                tCommon("scheduledAt"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
        valueGetter: (value: Date | null | undefined) => {
            if (!value) return tCommon("notScheduledYet");
            const date = value instanceof Date ? value : new Date(value);
            return date.toISOString().split("T")[0];
        },
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
