import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { LoginAPI } from "../../api/login.api";
import { API_URI } from "../../api/utils";
import { ErrorActions } from "../../application/actions/error.actions";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { ERR_MESS_SERVER_INTERNAL, ERR_TYPE_INTERNAL } from "../../application/reducers/error.reducer";
import msLogo from "../../images/msLogo.png";
import { Button } from "../components/button.component";
import { Page } from "../components/page.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import { useUser } from "../../application/hooks/use-user.hook";
import { useAppDispatch } from "../../application/hooks/use-app-redux.hook";

interface LoginLocationState {
    from: string | undefined;
}

const LoginPageBody = () => {
    const { t } = useTranslation("loginPage");

    const dispatch = useAppDispatch();

    const navigate = useNavigate();
    const location = useLocation() as Location<LoginLocationState>;
    const from = location.state?.from ?? "/";

    const { isLoggedIn } = useUser();

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: false,
                showUniversalHeaderNavigation: false,
                showProjectInfo: false,
                getCatalogInfo: false,
            })
        );
    }, [dispatch]);

    const [buttons, setButtons] = useState<ReactNode>(<Button>Loading Interface...</Button>);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const failed = params.get("failure");

        if (isLoggedIn) {
            navigate(from, { replace: true });
        } else if (failed != null) {
            dispatch(
                ErrorActions.setAPIError({
                    name: ERR_TYPE_INTERNAL,
                    message: ERR_MESS_SERVER_INTERNAL,
                })
            );

            // react does not know this, hack to clear get params.
            window.history.replaceState(null, "", "/login");
        }

        const testUserLoginButtons = [
            <Button
                key="test-user-privileged"
                component="a"
                href={`${API_URI}/auth/login?testUser=0`}
                data-testid="login-page_login-privileged"
                sx={{ marginRight: 0, fontSize: 20 }}
            >
                {t("testUserPrivileged")}
            </Button>,
            <br key="test-user-login-break" />,
            <Button
                key="test-user-unprivileged"
                component="a"
                href={`${API_URI}/auth/login?testUser=1`}
                data-testid="login-page_login-unprivileged"
                sx={{ marginRight: 0, fontSize: 20 }}
            >
                {t("testUserUnprivileged")}
            </Button>,
            <br key="test-user-login-trailing-break" />,
        ];

        const MSLoginButtons = [
            <Button
                key="ms-login"
                component="a"
                href={`${API_URI}/auth/login`}
                // @ts-expect-error TODO: Should this Button not be displayed? If so, we should move display={"none"} to the sx prop, since display is not a prop of Button and it is therefore currently being displayed.
                display={"none"}
                data-testid="SaveButton"
                sx={{ marginRight: 0, fontSize: 20 }}
            >
                <Box
                    component="img"
                    sx={{ width: 32, height: 32, mr: 1 }}
                    src={msLogo}
                    data-testid="login-page_login-button"
                ></Box>
                {t("login")}
            </Button>,
        ];

        let OIDCButtons = [
            <Button
                key="ms-login"
                component="a"
                href={`${API_URI}/auth/login`}
                display={"none"}
                data-testid="SaveButton"
                sx={{ marginRight: 0, fontSize: 20 }}
            >
                <Box
                    component="img"
                    sx={{ width: 32, height: 32, mr: 1 }}
                    src={msLogo}
                    data-testid="login-page_login-button"
                ></Box>
                {t("login")} OIDC
            </Button>,
        ];

        /*
        Here the component directly calls the API component; normally this would be done via a middleware/redux actions,
        but since this is only a simple GET request for a single variable in a synchronous manner,
        we chose to go the direct route here. Nevertheless, this does violate the normal React Redux API call pattern
        and should not normally be done.
         */
        LoginAPI.getAuthenticationMode().then((authenticationMode) => {
            if (authenticationMode === "azure") {
                setButtons(MSLoginButtons);
            } else if (authenticationMode === "oidc") {
                setButtons(OIDCButtons);
            } else {
                setButtons(testUserLoginButtons);
            }
        });
    }, [dispatch, from, isLoggedIn, navigate, t]);

    return (
        <Page>
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Avatar sx={{ m: 1, bgcolor: "background.default" }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    {t("signin")}
                </Typography>
                <Box sx={{ mt: 1 }}>{buttons}</Box>
            </Box>
        </Page>
    );
};

export const LoginPage = CreatePage(HeaderNavigation, LoginPageBody);
