import Box from "@mui/material/Box";
import { useAppSelector } from "../../application/hooks/use-app-redux.hook";
import ErrorBoundary from "../wrappers/error.wrapper";
import { LanguagePicker } from "./language-picker.component";
import UserPanel from "./user-panel.component";

export const HeaderUtilityControls = () => {
    const showUniversalHeaderNavigation = useAppSelector((state) => state.navigation.showUniversalHeaderNavigation);

    return (
        <ErrorBoundary>
            <Box
                sx={{
                    gridArea: "right",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                }}
            >
                <LanguagePicker />
                {showUniversalHeaderNavigation && <UserPanel />}
            </Box>
        </ErrorBoundary>
    );
};
