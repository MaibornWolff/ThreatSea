import TableCell from "@mui/material/TableCell";

const CustomTableCell = ({ sx, showBorder = false, children, ...props }) => {
    const borderRight = showBorder ? "1.5px solid #00000000" : null;
    return (
        <TableCell
            align="center"
            sx={{
                fontSize: "0.875rem",
                borderRight,
                borderRightColor: "primary.main",
                borderBottomColor: "#fff",
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
