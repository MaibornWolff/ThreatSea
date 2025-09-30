/**
 * @module error.wrapper - Defines the clientside error boundary.
 */

import { ChevronLeft, ContentCopyOutlined, ErrorOutlineOutlined } from "@mui/icons-material";
import { Alert } from "@mui/material";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Box } from "@mui/system";
import React from "react";
import { useLocation } from "react-router";
import logo from "../../images/threatsealogo-dez.png";
import { IconButton } from "../components/icon-button.component";
import { Page } from "../components/page.component";
import { translationUtil } from "../../utils/translations";

/**
 * React component used as a fallback ui when an exception occurs.
 */
class ErrorBoundary extends React.Component {
    /**
     * Initialises the state with an error flag.
     *
     * @param {object} props - Component properties.
     */
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
        };
    }

    /**
     * Used to trigger an error and call the fallback ui.
     *
     * @param {object} error - Formatted error stacktrace.
     * @returns The new state with the error flag set and the error information.
     */
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    /**
     * Used to log information about incoming errors.
     *
     * @param {object} error - Stacktrace of the error formatted.
     * @param {object} errorInfo - Raw Stacktrace of the error as a string.
     */
    componentDidCatch(error, errorInfo) {
        console.log(error);
        console.log(errorInfo);
    }

    /**
     * Lets the user copy the stacktrace of the error when
     * clicking on the copy icon.
     *
     * @event IconButton#onClick
     * @param {SyntheticBaseEvent} evt - onclick event.
     * @param {string} text - Stacktrace of the error
     */
    handleOnCopyClick(evt, text) {
        evt.preventDefault();

        navigator.clipboard.writeText(text);

        document.getElementById("copyAlert").style.display = "flex";
        setTimeout(() => {
            document.getElementById("copyAlert").style.display = "none";
        }, 5000);
    }

    render() {
        if (this.state.hasError) {
            return (
                <ErrorMenu sx={{ height: "100%" }}>
                    <Page sx={{ height: "100%" }}>
                        <Box
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Button
                                disableElevation
                                variant="text"
                                href={"/"}
                                sx={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    borderRadius: 5,
                                    width: "fit-content",
                                    textTransform: "initial",
                                    mt: 5,
                                    mb: 3,
                                    padding: 0,
                                    paddingRight: 2,
                                    "&:hover": {
                                        cursor: "pointer",
                                        backgroundColor: "primary.light",
                                    },
                                }}
                            >
                                <IconButton
                                    color="primary"
                                    sx={{
                                        color: "text.primary",
                                        paddingRight: 2,
                                        "&:hover": {
                                            backgroundColor: "#00000000",
                                        },
                                    }}
                                >
                                    <ChevronLeft sx={{ fontSize: 18 }} />
                                </IconButton>
                                <Typography
                                    sx={{
                                        color: "text.primary",
                                        fontWeight: "bold",
                                        fontSize: "0.875rem",
                                    }}
                                    variant={"h6"}
                                >
                                    {translationUtil.t("errorBoundary:backTo")}
                                </Typography>
                            </Button>

                            <Box
                                sx={{
                                    backgroundColor: "background.paperIntransparent",
                                    padding: 4,
                                    boxShadow: 1,
                                    borderRadius: 5,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        marginBottom: 1,
                                    }}
                                >
                                    <ErrorOutlineOutlined
                                        sx={{
                                            fontSize: 18,
                                            marginRight: 1,
                                            color: "#f00",
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: "0.875rem",
                                            color: "#f00",
                                        }}
                                    >
                                        {translationUtil.t("errorBoundary:errorNotice")}
                                    </Typography>
                                </Box>

                                <Typography sx={{ fontSize: "0.75rem" }}>
                                    <Typography
                                        sx={{
                                            fontWeight: "bold",
                                            display: "inline-block",
                                            fontSize: "0.75rem",
                                        }}
                                    >
                                        {translationUtil.t("errorBoundary:messageDescription")}:
                                    </Typography>{" "}
                                    &ldquo;{this.state.error.message}&ldquo;
                                </Typography>
                            </Box>

                            <Box
                                sx={{
                                    backgroundColor: "background.paperIntransparent",
                                    padding: 4,
                                    borderRadius: 5,
                                    boxShadow: 1,
                                    marginTop: 1,
                                    marginBottom: 5,
                                    height: "100%",
                                    overflow: "hidden",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        height: "100%",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                            alignItems: "flex-start",
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: "0.75rem",
                                                fontWeight: "bold",
                                                display: "inline-block",
                                                marginRight: 1,
                                            }}
                                        >
                                            {translationUtil.t("errorBoundary:moreInfo")}
                                        </Typography>

                                        <IconButton
                                            title={translationUtil.t("errorBoundary:copyBtn")}
                                            onClick={(e) => this.handleOnCopyClick(e, this.state.error.stack)}
                                        >
                                            <ContentCopyOutlined
                                                sx={{
                                                    fontSize: 14,
                                                    marginTop: -1.0,
                                                }}
                                            />
                                        </IconButton>
                                    </Box>

                                    <Box
                                        sx={{
                                            maxHeight: "100%",
                                            overflowY: "auto",
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <pre>{this.state.error.stack}</pre>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box
                            id="copyAlert"
                            sx={{
                                display: "none",
                                justifyContent: "center",
                                position: "absolute",
                                bottom: 24,
                                left: 0,
                                width: "100%",
                            }}
                        >
                            <Alert variant="filled" severity="info" sx={{ borderRadius: 5 }}>
                                {translationUtil.t("errorBoundary:copied")}
                            </Alert>
                        </Box>
                    </Page>
                </ErrorMenu>
            );
        }

        return this.props.children;
    }
}

/**
 * Creates a wrapper for the error component.
 *
 * @param {object} children - Childelements encapsulated into this
 *     component.
 * @returns React component that wraps children inside
 *     boxes and styles them appropriately.
 */
const ErrorMenu = ({ children }) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                maxHeight: "100vh",
                height: "100%",
                bgcolor: "rgba(35, 60, 87, 0.1)",
            }}
        >
            <Header />
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    flex: 1,
                    height: "100%",
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: 8,
                    bgcolor: "background.main",
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

/**
 * Renders the header of the error page.
 * @returns React component for the header bar.
 */
const Header = () => {
    const { state } = useLocation();
    const { project } = state || {};

    return (
        <Box
            component="header"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            paddingTop={1.5}
            paddingBottom={1.5}
            paddingLeft={6}
            paddingRight={6}
            sx={{ backgroundColor: "#4f6684" }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <Button
                    sx={{
                        padding: 0,
                        margin: 0,
                        marginTop: "3.5px",
                        marginBottom: "9.5px",
                        "&:hover": { backgroundColor: "#0000" },
                    }}
                    disableRipple
                    href="/"
                >
                    <img id={"logo"} src={logo} height={48} alt={"Logo"} />
                </Button>
                {project && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            bgcolor: "primary.dark",
                            color: "text.primary",
                            ml: 8,
                            borderRadius: 5,
                            boxShadow: 1,
                        }}
                    ></Box>
                )}
            </Box>
        </Box>
    );
};

export default ErrorBoundary;
