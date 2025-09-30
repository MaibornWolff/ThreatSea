/**
 * @module table-header.component Defines a universally
 *     applicable table header.
 */

import { TableCell, TableSortLabel, Box } from "@mui/material";

/**
 * Creates a wrapper component for the table headers of the list.
 *
 * @param {string} name - Name of the header.
 * @param {object} children - Children components.
 * @param {object} sx - Styles as an object.
 * @param {string} sortBy - Sort attribute.
 * @param {string} sortDirection - Direction to sort.
 * @param {Function} onClick - Onclick handler.
 * @param {boolean} showBorder - Indicator if the border should be visible.
 * @param {object} props - Recevied properties.
 * @returns React component for a table header cell.
 */
const CustomTableHeaderCell = ({
    name,
    children,
    sx,
    sortBy = null,
    sortDirection,
    onClick,
    showBorder = false,
    ...props
}) => {
    const active = sortBy === name;

    const backgroundColor = active ? "table.headerBackgroundSelected" : "table.headerBackground";

    const borderRight = showBorder ? "1.5px solid #00000000" : null;

    /**
     * Executes the received onclick handler on this table header.
     * @event TableCell#onClick
     * @param {SyntheticBaseEvent} e - Onclick event.
     */
    const handleOnClick = (e) => {
        if (onClick) {
            onClick(e, name);
        }
    };

    return (
        <TableCell
            onClick={handleOnClick}
            align="center"
            sortDirection={sortDirection}
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
                <TableSortLabel active={active} direction={sortDirection}>
                    <Box sx={{ marginLeft: "26px" }}> {children} </Box>
                </TableSortLabel>
            ) : (
                <Box> {children} </Box>
            )}
        </TableCell>
    );
};

export default CustomTableHeaderCell;
