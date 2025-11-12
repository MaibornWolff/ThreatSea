import type { KeyboardEvent } from "react";

import { Box, IconButton, InputBase } from "@mui/material";
import { Search } from "@mui/icons-material";
import type { InputBaseProps } from "@mui/material/InputBase";
import type { SxProps, Theme } from "@mui/material/styles";

type SearchFieldProps = Omit<InputBaseProps, "sx"> & {
    iconButtonProps?: SxProps<Theme>;
    sx?: SxProps<Theme>;
    inputSx?: SxProps<Theme>;
};

export const SearchField = ({ iconButtonProps = {}, sx = {}, inputSx = {}, ...props }: SearchFieldProps) => {
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
            onKeyUp={(event: KeyboardEvent<HTMLDivElement>) => {
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
