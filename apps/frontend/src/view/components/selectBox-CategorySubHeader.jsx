import ListSubheader from "@mui/material/ListSubheader";

/*
    Custom Subheader for Categories in a Select Box
 */
const SelectBoxCategorySubHeader = ({ children }) => {
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
