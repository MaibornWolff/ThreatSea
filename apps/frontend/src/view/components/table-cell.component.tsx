import TableCell from "@mui/material/TableCell";
import type { TableCellProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

interface CustomTableCellProps extends TableCellProps {
    sx?: SxProps<Theme>;
    showBorder?: boolean;
}

const CustomTableCell = ({ sx, showBorder = false, children, ...props }: CustomTableCellProps) => {
    const borderRight = showBorder ? "1.5px solid transparent" : null;
    return (
        <TableCell
            align="center"
            sx={{
                fontSize: "0.875rem",
                borderRight,
                borderRightColor: "primary.main",
                borderBottomColor: "border.divider",
                whiteSpace: "nowrap",
                ...sx,
            }}
            {...props}
        >
            {children}
        </TableCell>
    );
};

export default CustomTableCell;
