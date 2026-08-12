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
        <Box sx={{ width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 0.5 }}>
                <Typography sx={{ fontWeight: "bold", fontSize: "0.875rem", textAlign: "center" }}>{label}</Typography>
                <MuiIconButton
                    size="small"
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleExpanded(field);
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
