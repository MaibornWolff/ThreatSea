import {
    DataGrid,
    GridRow,
    type GridColDef,
    type GridColumnResizeParams,
    type GridColumnVisibilityModel,
    type GridPaginationModel,
    type GridRowProps,
    type GridSortModel,
} from "@mui/x-data-grid";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { useTheme } from "@mui/material/styles";
import { useCallback, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ExtendedThreat } from "#api/types/threat.types.ts";
import { THREAT_STATUSES } from "#api/types/threat-statuses.types.ts";
import { NoRowsOverlay } from "#view/components/no-rows-overlay.component.tsx";
import { GENERIC_THREAT_ROW_PREFIX, THREAT_ROW_PREFIX, type ThreatsGridRow } from "./create-threats-columns";

// The e2e page objects locate action buttons inside the row-level test ids, so
// the ids must live on the grid row element itself, not on a single cell.
const ThreatsGridRowSlot = (props: GridRowProps) => {
    const rowId = String(props.rowId);
    const testId = rowId.startsWith(GENERIC_THREAT_ROW_PREFIX)
        ? "threats-page_generic-threats-list-entry"
        : rowId.startsWith(THREAT_ROW_PREFIX)
          ? "threats-page_threats-list-entry"
          : undefined;
    return <GridRow {...props} data-testid={testId} />;
};

interface ThreatsGridProps {
    rows: ThreatsGridRow[];
    columns: GridColDef<ThreatsGridRow>[];
    loading: boolean;
    columnVisibilityModel: GridColumnVisibilityModel;
    // sorting and pagination are applied to whole generic threats by the row builder
    sortModel: GridSortModel;
    onSortModelChange: (model: GridSortModel) => void;
    paginationModel: GridPaginationModel;
    onPaginationModelChange: (model: GridPaginationModel) => void;
    genericThreatCount: number;
    onColumnWidthChange: (params: GridColumnResizeParams) => void;
    onToggleGenericThreat: (genericThreatId: number) => void;
    onEditThreat: (event: MouseEvent<HTMLElement>, threat: ExtendedThreat) => void;
}

/**
 * The threats table: generic threat rows that expand to their threats. A generic threat row
 * toggles on click or Enter/Space; a threat row opens the threat for editing.
 *
 * Sorting and pagination run in "server" mode: the grid only renders the header arrows and the
 * footer, and shows the rows exactly as given. The rows are already sorted and cut to the page's
 * generic threats, so a generic threat is never split from its threats across pages.
 */
export const ThreatsGrid = ({
    rows,
    columns,
    loading,
    columnVisibilityModel,
    sortModel,
    onSortModelChange,
    paginationModel,
    onPaginationModelChange,
    genericThreatCount,
    onColumnWidthChange,
    onToggleGenericThreat,
    onEditThreat,
}: ThreatsGridProps) => {
    const { t } = useTranslation("threatsPage");
    const NoRowsOverlayWithMessage = useCallback(() => <NoRowsOverlay message={t("noThreatsFound")} />, [t]);
    // A localeText prop replaces the theme's DataGrid texts instead of adding to them, so start from the
    // theme's (the app language) and only override the page-size label, which counts generic threats.
    const themeLocaleText = useTheme().components?.MuiDataGrid?.defaultProps?.localeText;

    return (
        <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => row.rowId}
            loading={loading}
            disableRowSelectionOnClick
            disableColumnFilter
            disableColumnMenu
            disableColumnSelector
            onCellClick={(params, event) => {
                const row = params.row as ThreatsGridRow;
                // A generic threat row toggles from any cell (including the "n threats" text in
                // the actions cell); its add button stops propagation to keep its action.
                if (row.rowType === "genericThreat") {
                    onToggleGenericThreat(row.genericThreat.id);
                } else if (row.rowType === "threat" && params.field !== "actions") {
                    onEditThreat(event as unknown as MouseEvent<HTMLElement>, row.threat);
                }
            }}
            onCellKeyDown={(params, event) => {
                // Keyboard equivalent of the cell click; skip events coming from
                // interactive elements inside a cell (they handle Enter natively —
                // acting here as well would double-trigger their action).
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }
                if ((event.target as HTMLElement).closest("button, a, input")) {
                    return;
                }
                const row = params.row as ThreatsGridRow;
                if (row.rowType === "genericThreat") {
                    event.preventDefault();
                    onToggleGenericThreat(row.genericThreat.id);
                } else if (row.rowType === "threat" && params.field !== "actions") {
                    event.preventDefault();
                    onEditThreat(event as unknown as MouseEvent<HTMLElement>, row.threat);
                }
            }}
            getRowClassName={(params) => {
                const row = params.row as ThreatsGridRow;
                // Finalized / out-of-scope threats are visually de-emphasised as a hint,
                // but nothing is actually blocked — the status and the action buttons stay
                // at full opacity (see the per-cell overrides below) so they remain
                // clearly readable and usable.
                if (
                    row.rowType === "threat" &&
                    (row.threat.status === THREAT_STATUSES.FINALIZED ||
                        row.threat.status === THREAT_STATUSES.OUTOFSCOPE)
                ) {
                    return "threats-grid--dimmed";
                }
                return "";
            }}
            columnHeaderHeight={90}
            columnVisibilityModel={columnVisibilityModel}
            sortingMode="server"
            sortingOrder={["asc", "desc"]}
            sortModel={sortModel}
            onSortModelChange={onSortModelChange}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={onPaginationModelChange}
            rowCount={genericThreatCount}
            localeText={{ ...themeLocaleText, paginationRowsPerPage: t("genericThreatsPerPage") }}
            onColumnWidthChange={onColumnWidthChange}
            sx={{
                borderRadius: 5,
                boxShadow: 1,
                "& .MuiDataGrid-row": { cursor: "pointer" },
                "& .MuiDataGrid-cell:focus": { outline: "none" },
                "& .MuiDataGrid-columnHeader:focus": { outline: "none" },
                "& .MuiDataGrid-columnHeader": { padding: "8px 16px" },
                "& .MuiDataGrid-cell": { cursor: "pointer" },
                // Dim per cell (not per row) so the exemptions below can win.
                "& .threats-grid--dimmed .MuiDataGrid-cell": { opacity: 0.6 },
                "& .threats-grid--dimmed .MuiDataGrid-cell[data-field='status']": { opacity: 1 },
                "& .threats-grid--dimmed .MuiDataGrid-cell[data-field='actions']": { opacity: 1 },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            slots={{ noRowsOverlay: NoRowsOverlayWithMessage, row: ThreatsGridRowSlot }}
        />
    );
};
