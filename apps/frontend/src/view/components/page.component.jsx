import Box from "@mui/material/Box";

/**
 * page wrapper for all pages
 * @component
 * @category Components
 */
export const Page = ({ sx = {}, ...props }) => {
    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                color: "text.primary",
                display: "flex",
                flexDirection: "column",
                padding: 1,
                maxHeight: "100%",
                position: "relative",
                paddingLeft: 6,
                paddingRight: 6,
                ...sx,
            }}
            {...props}
        ></Box>
    );
};
