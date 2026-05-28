import Box from "@mui/material/Box";
import { useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import ErrorBoundary from "#view/wrappers/error.wrapper.tsx";
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
