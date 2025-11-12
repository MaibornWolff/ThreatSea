import { Alert as MaterialAlert, Box, Typography } from "@mui/material";
import type { AlertColor } from "@mui/material/Alert";
import { useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAlert } from "../../application/hooks/use-alert.hook";
import { useAppDispatch, useAppSelector } from "../../application/hooks/use-app-redux.hook";
import { UserActions } from "../../application/actions/user.actions";
import { ERR_TYPE_API, ERR_TYPE_PROJECT_CATALOG_EXISTANCE } from "../../application/reducers/error.reducer";

export const Alert = (): JSX.Element | null => {
    const { text, type, visible, close, showErrorMessage } = useAlert();

    const error = useAppSelector((state) => state.error);
    const dispatch = useAppDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    useLayoutEffect(() => {
        if (error.type) {
            console.log(error.type + " " + error.message);
            if (error.type === ERR_TYPE_API) {
                dispatch(UserActions.setUserLoggedOut());
                if (location.pathname !== "/login") navigate("/login", { replace: true });
            } else if (error.type === ERR_TYPE_PROJECT_CATALOG_EXISTANCE) {
                navigate("/projects", { replace: true });
            }

            // Only show message on internal server error.
            showErrorMessage({ message: error.message });
        }
    }, [dispatch, error, location.pathname, navigate, showErrorMessage]);

    if (!visible) {
        return null;
    }

    const severity = (type ?? "info") as AlertColor;

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                position: "absolute",
                bottom: 16,
                left: 0,
                width: "100%",
            }}
        >
            <MaterialAlert sx={{ borderRadius: 5 }} variant="filled" severity={severity} onClose={close}>
                <Typography
                    sx={{
                        fontStyle: "italic",
                        fontSize: "0.875rem",
                    }}
                >
                    {text}
                </Typography>
            </MaterialAlert>
        </Box>
    );
};
