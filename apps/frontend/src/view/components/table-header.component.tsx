import type { ReactNode, SyntheticEvent } from "react";
import { Box, TableCell, TableSortLabel } from "@mui/material";
import type { TableCellProps } from "@mui/material/TableCell";
import type { SortDirection } from "#application/actions/list.actions.ts";

interface CustomTableHeaderCellProps extends Omit<TableCellProps, "onClick"> {
    name?: string;
    children?: ReactNode;
    sortBy?: string | null;
    sortDirection?: SortDirection;
    onClick?: (event: SyntheticEvent, name: string | null) => void;
    showBorder?: boolean;
}

export const CustomTableHeaderCell = ({
    name,
    children,
    sx = {},
    sortBy = null,
    sortDirection,
    onClick,
    showBorder = false,
    ...props
}: CustomTableHeaderCellProps) => {
    const active = sortBy === name;

    const backgroundColor = active ? "table.headerBackgroundSelected" : "table.headerBackground";

    const borderRight = showBorder ? "1.5px solid #00000000" : undefined;

    const handleOnClick = (event: SyntheticEvent) => {
        if (onClick) {
            onClick(event, name ?? "");
        }
    };

    return (
        <TableCell
            onClick={handleOnClick}
            align="center"
            {...(sortDirection ? { sortDirection } : {})}
            sx={{
                fontWeight: "bold",
                fontSize: "0.875rem",
                backgroundColor,
                borderBottomColor: "primary.main",
                borderBottomWidth: "1.5px",
                "&:hover": sortBy
                    ? {
                          cursor: "pointer",
                          backgroundColor: "primary.light",
                      }
                    : undefined,
                borderRight,
                borderRightColor: "primary.main",
                ...sx,
            }}
            {...props}
        >
            {sortBy ? (
                <TableSortLabel active={active} {...(sortDirection ? { direction: sortDirection } : {})}>
                    <Box sx={{ marginLeft: "26px" }}> {children} </Box>
                </TableSortLabel>
            ) : (
                <Box> {children} </Box>
            )}
        </TableCell>
    );
};
