import { FileDownload } from "@mui/icons-material";
import { IconButton } from "./icon-button.component";

export const ExportIconButton = ({ ...props }) => {
    return (
        <IconButton {...props}>
            <FileDownload sx={{ fontSize: 18 }} />
        </IconButton>
    );
};
