import { IconButton, Box, InputBase } from "@mui/material";
import { Search } from "@mui/icons-material";

export const SearchField = ({ iconButtonProps, sx = {}, inputSx = {}, ...props }) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                bgcolor: "background.paper",
                borderRadius: 5,
                boxShadow: 1,
                padding: 0,
                pl: 2,
                height: "35px",
                "&:hover .search-icon-button": {
                    color: "primary.light",
                },
                ...sx,
            }}
            //dont delete the whole Component if Delete is pressed
            onKeyUp={(event) => {
                if (event.key === "Delete") {
                    event.stopPropagation();
                }
            }}
        >
            <InputBase
                size="small"
                sx={{
                    fontSize: "0.875rem",
                    "&.Mui-focused + .search-icon-button": {
                        color: "primary.light",
                    },
                    ...inputSx,
                }}
                {...props}
            />
            <IconButton
                className="search-icon-button"
                sx={{
                    "&:hover": {
                        bgcolor: "primary.dark",
                    },
                    color: "text.primary",
                    ...iconButtonProps,
                }}
            >
                <Search sx={{ fontSize: 18 }} />
            </IconButton>
        </Box>
    );
};
