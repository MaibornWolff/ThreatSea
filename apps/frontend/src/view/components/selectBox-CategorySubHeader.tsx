import ListSubheader from "@mui/material/ListSubheader";
import type { ReactNode, FC } from "react";

interface SelectBoxCategorySubHeaderProps {
    children: ReactNode;
}

/*
    Custom Subheader for Categories in a Select Box
 */
const SelectBoxCategorySubHeader: FC<SelectBoxCategorySubHeaderProps> & { muiSkipListHighlight?: boolean } = ({
    children,
}) => {
    return (
        <ListSubheader
            sx={{
                bgcolor: "background.main",
                fontWeight: "bold",
            }}
        >
            {children}
        </ListSubheader>
    );
};

SelectBoxCategorySubHeader.muiSkipListHighlight = true;

export default SelectBoxCategorySubHeader;
