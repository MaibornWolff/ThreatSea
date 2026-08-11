import Delete from "@mui/icons-material/Delete";
import { Box, Typography } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Member } from "#api/types/members.types.ts";
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
    handleDeleteMember: (member: Member) => void;
}

export const createMembersColumns = ({
    t,
    tCommon,
    userRole,
    columnFilters,
    handleFilterChange,
    expandedFilters,
    toggleFilterExpanded,
    handleDeleteMember,
}: ColumnConfig): GridColDef[] => [
    {
        field: "name",
        headerName: tCommon("name"),
        flex: 1,
        minWidth: 200,
        align: "center",
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
        field: "email",
        headerName: tCommon("email"),
        flex: 1,
        minWidth: 220,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="email"
                label={tCommon("email")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
    },
    {
        field: "role",
        headerName: tCommon("role"),
        width: 180,
        align: "center",
        headerAlign: "center",
        renderHeader: () => (
            <ColumnFilterHeader
                field="role"
                label={tCommon("role")}
                columnFilters={columnFilters}
                onFilterChange={handleFilterChange}
                expandedFilters={expandedFilters}
                onToggleExpanded={toggleFilterExpanded}
            />
        ),
        valueGetter: (value: USER_ROLES) => t(`userRoles.${value}`),
        renderCell: (params: GridRenderCellParams<Member, string>) => (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                <Typography sx={{ fontSize: "0.875rem", fontWeight: "bold" }}>{params.value}</Typography>
            </Box>
        ),
    },
    ...(checkUserRole(userRole, USER_ROLES.OWNER)
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
                  renderCell: (params: GridRenderCellParams<Member>) => (
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
                              title={t("deleteMember")}
                              hoverColor="error"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMember(params.row);
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
