import Box from "@mui/material/Box";

/**
 * page wrapper for all pages
 * @component
 * @category Components
 */
export const Page = (props) => {
    return (
        <Box
            component="main"
            flex={1}
            sx={{ color: "text.primary" }}
            display="flex"
            flexDirection="column"
            padding={1}
            maxHeight="100%"
            position="relative"
            paddingLeft={6}
            paddingRight={6}
            {...props}
        ></Box>
    );
};
