import { Delete, ExpandMore } from "@mui/icons-material";
import { Box, Collapse, IconButton as MuiIconButton, TextField, Typography } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import type { TFunction } from "i18next";
import type { Member } from "#api/types/members.types.ts";
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
    handleDeleteMember: (member: Member) => void;
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
        field: "email",
        headerName: tCommon("email"),
        flex: 1,
        minWidth: 220,
        align: "center",
        headerAlign: "center",
        renderHeader: () =>
            createFilterHeader(
                "email",
                tCommon("email"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
    },
    {
        field: "role",
        headerName: tCommon("role"),
        width: 180,
        align: "center",
        headerAlign: "center",
        renderHeader: () =>
            createFilterHeader(
                "role",
                tCommon("role"),
                columnFilters,
                handleFilterChange,
                expandedFilters,
                toggleFilterExpanded
            ),
        valueGetter: (value: USER_ROLES) => t(`userRoles.${value}`),
        renderCell: (params: GridRenderCellParams<Member, string>) => (
            <Typography sx={{ fontSize: "0.875rem", fontWeight: "bold" }}>{params.value}</Typography>
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
                      <Box sx={{ display: "flex", paddingRight: 2, paddingLeft: 2 }}>
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
