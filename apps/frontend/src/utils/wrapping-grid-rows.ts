// DataGrid's standard row height. An "auto" row drops it as its minimum and would shrink to its content.
const MINIMUM_ROW_HEIGHT = 52;

/** Lets every row grow to fit cell text that wraps onto a second line (see OverflowText). */
export const getWrappingRowHeight = () => "auto" as const;

/**
 * Grid `sx` entries for a grid using getWrappingRowHeight. A cell in an "auto" row is only as tall
 * as its content, so this keeps rows at least the standard height and centres every cell's content
 * vertically within the tallest cell of its row. The column direction keeps plain values (numbers,
 * dates) full width, so the cell's text alignment still applies to them.
 */
export const wrappingGridRowStyles = {
    "& .MuiDataGrid-row--dynamicHeight > .MuiDataGrid-cell": {
        minHeight: MINIMUM_ROW_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        py: 1,
    },
} as const;
