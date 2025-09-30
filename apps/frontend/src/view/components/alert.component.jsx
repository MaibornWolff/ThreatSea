/**
 * @module alert-component - The react alert component.
 */
import { Alert as MaterialAlert, Box, Typography } from "@mui/material";
import { useAlert } from "../../application/hooks/use-alert.hook";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useLayoutEffect } from "react";
import { ERR_TYPE_API, ERR_TYPE_PROJECT_CATALOG_EXISTANCE } from "../../application/reducers/error.reducer";
import { UserActions } from "../../application/actions/user.actions";

/**
 * Defines the alert component.
 *
 * @returns Component that defines the alert.
 */
export const Alert = () => {
    const { text, type, visible, close, showErrorMessage } = useAlert();

    const error = useSelector((state) => state.error);
    const dispatch = useDispatch();
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
    }, [error]);

    return (
        visible && (
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
                <MaterialAlert sx={{ borderRadius: 5 }} variant="filled" severity={type} onClose={close}>
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
        )
    );
};
