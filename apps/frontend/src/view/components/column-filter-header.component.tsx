import ExpandMore from "@mui/icons-material/ExpandMore";
import { Box, Collapse, IconButton as MuiIconButton, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface ColumnFilterHeaderProps {
    field: string;
    label: string;
    columnFilters: Record<string, string>;
    onFilterChange: (field: string, value: string) => void;
    expandedFilters: Record<string, boolean>;
    onToggleExpanded: (field: string) => void;
    children?: ReactNode;
}

export const ColumnFilterHeader = ({
    field,
    label,
    columnFilters,
    onFilterChange,
    expandedFilters,
    onToggleExpanded,
    children,
}: ColumnFilterHeaderProps) => {
    const { t } = useTranslation("common");

    return (
        <Box
            sx={{ width: "100%" }}
            // The DataGrid header cell sorts on Enter; Enter inside the filter controls must only act on the control.
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    event.stopPropagation();
                }
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>{label}</Typography>
                {/*
                    Deliberately not a tab stop, like DataGrid's own header icons: the grid moves header focus to the
                    first tabindex="0" element inside it, so a focusable chevron would take the header's keyboard focus
                    and Enter would toggle the filter instead of sorting. Accepted trade-off: collapsing a filter is
                    mouse-only; the (expanded by default) filter input stays reachable with Tab. A focusable filter
                    passed as children (e.g. a Select) still takes the header focus, so that column sorts by mouse only.
                */}
                <MuiIconButton
                    size="small"
                    tabIndex={-1}
                    aria-label={t("toggleColumnFilter", { column: label })}
                    aria-expanded={expandedFilters[field] ?? true}
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleExpanded(field);
                    }}
                    sx={{
                        ml: 0.5,
                        padding: 0.25,
                        transform: (expandedFilters[field] ?? true) ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                    }}
                >
                    <ExpandMore sx={{ fontSize: 18 }} />
                </MuiIconButton>
            </Box>
            {/* Expanded by default: collapsed filters proved hard to discover for users. */}
            <Collapse in={expandedFilters[field] ?? true} timeout={200}>
                {children ?? (
                    <TextField
                        size="small"
                        placeholder={t("filterPlaceholder")}
                        value={columnFilters[field] || ""}
                        onChange={(event) => onFilterChange(field, event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        sx={{ width: "100%" }}
                    />
                )}
            </Collapse>
        </Box>
    );
};
