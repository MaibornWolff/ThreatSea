import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SyncIcon from "@mui/icons-material/Sync";
import { IconButton, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { useLayoutEffect, useState, type ComponentType, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../application/hooks/use-app-redux.hook";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { store } from "#main.jsx";
import { CatalogsActions } from "../../application/actions/catalogs.actions";
import { ProjectsActions } from "../../application/actions/projects.actions";
import { catalogsSelector } from "../../application/selectors/catalogs.selector";
import { editorSelectors } from "../../application/selectors/editor.selectors";
import { projectsSelectors } from "../../application/selectors/projects.selectors";
import logo from "../../images/threatsealogo-dez.png";
import ErrorBoundary from "../wrappers/error.wrapper";
import { LanguagePicker } from "./language-picker.component";
import { ToggleButtons, type ToggleButtonConfig, type ToggleButtonsProps } from "./toggle-buttons.component";
import UserPanel from "./user-panel.component";
import { checkUserRole, USER_ROLES } from "../../api/types/user-roles.types";
import ProjectDialogPage from "#view/pages/project-dialog.page.tsx";
import { Edit } from "@mui/icons-material";

export const CreatePage = <P extends object>(
    HeaderNavigation: ComponentType,
    PageBody: ComponentType<P & { updateAutoSaveOnClick?: (onClick: () => void) => void }>,
    showAutoSave = false
) => {
    const Inner = (props: P) => {
        const dispatch = useAppDispatch();
        const navigate = useNavigate();
        const { pathname } = useLocation();

        const { projectId, catalogId } = useParams();

        const projects = useAppSelector((state) => state.projects);
        let currentProjectJSON;
        if (projectId) {
            const currentProject = projects.entities[parseInt(projectId)];
            currentProjectJSON = JSON.stringify(currentProject);
        }

        const project = useAppSelector((state) => state.projects.current);
        const showProjectInfo = useAppSelector((state) => state.navigation.showProjectInfo);
        const getCatalogInfo = useAppSelector((state) => state.navigation.getCatalogInfo);

        const catalog = useAppSelector((state) => state.catalogs.current);

        const autoSaveStatus = useAppSelector(editorSelectors.selectAutoSaveStatus);
        const autoSaveText = useAppSelector(editorSelectors.selectAutoSaveHelperText);
        const [autoSaveOnClick, setAutoSaveOnClick] = useState<(() => void) | undefined>(undefined);

        const updateAutoSaveOnClick = (onClick: () => void) => {
            setAutoSaveOnClick(() => onClick);
        };

        let autoSaveIconColor = "#546581";
        switch (autoSaveStatus) {
            case "uninitialized":
                autoSaveIconColor = "#67ad5b";
                break;
            case "failed":
                autoSaveIconColor = "#c23f38";
                break;
            case "upToDate":
                autoSaveIconColor = "#67ad5b";
                break;
            case "notUpToDate":
                autoSaveIconColor = "#546581";
                break;
            case "saving":
                autoSaveIconColor = "#546581";
                break;
        }

        let autoSaveForegroundColor = "primary.main";
        switch (autoSaveStatus) {
            case "uninitialized":
                autoSaveForegroundColor = "#fff";
                break;
            case "failed":
                autoSaveForegroundColor = "#fff";
                break;
            case "upToDate":
                autoSaveForegroundColor = "#fff";
                break;
            case "notUpToDate":
                autoSaveForegroundColor = "#fff";
                break;
            case "saving":
                autoSaveForegroundColor = "#fff";
                break;
        }

        const showButton =
            autoSaveStatus === "failed" || autoSaveStatus === "notUpToDate" || autoSaveStatus === "upToDate";

        useLayoutEffect(() => {
            if (showProjectInfo && projectId) {
                const pid = parseInt(projectId);

                if (projectsSelectors.selectById(store.getState(), pid)) {
                    dispatch(ProjectsActions.getProjectFromRedux(pid));
                } else {
                    dispatch(ProjectsActions.getProjectFromBackend(pid));
                }
            } else if (getCatalogInfo && catalogId) {
                const cid = parseInt(catalogId);

                if (catalog?.id !== cid) {
                    if (catalogsSelector.selectById(store.getState(), cid)) {
                        dispatch(CatalogsActions.getCatalogFromRedux(cid));
                    } else {
                        dispatch(CatalogsActions.getCatalogFromBackend(cid));
                    }
                }
            }
        }, [showProjectInfo, projectId, dispatch, getCatalogInfo, catalogId, catalog?.id, currentProjectJSON]);

        const { t } = useTranslation("mainMenu");
        const footerLinks = [
            { url: "/imprint", text: t("imprint") },
            { url: "/privacy-policy", text: t("privacy") },
        ];

        const handleProjectInfoClick = (event: React.MouseEvent) => {
            event.stopPropagation();
            navigate(`${pathname}/editProject`, {
                state: { project },
            });
        };

        return (
            <ErrorBoundary>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                        maxHeight: "100vh",
                        height: "100%",
                        bgcolor: "background.default",
                    }}
                >
                    <Box
                        component="header"
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingTop: 1.5,
                            paddingBottom: 1.5,
                            paddingLeft: 6,
                            paddingRight: 6,
                            backgroundColor: "page.headerBackground",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                mr: 1,
                            }}
                        >
                            <Link to="/">
                                <img id={"logo"} src={logo} height={48} alt={"Logo"} />
                            </Link>
                            {showProjectInfo && (
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
                                >
                                    {showAutoSave === true && (
                                        <Box
                                            sx={{
                                                display: "inline-block",
                                                position: "relative",
                                                width: autoSaveOnClick && showButton === true ? "20px" : "20px",
                                                height: autoSaveOnClick && showButton === true ? "28px" : "20px",
                                                marginLeft: 1.25,
                                                "&:hover .auto-save-info": {
                                                    display: "inline-block",
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: "inline-block",
                                                    alignItems: "center",
                                                    justifyItems: "center",
                                                    marginLeft: autoSaveOnClick && showButton === true ? -0.5 : 0,
                                                    marginRight: autoSaveOnClick && showButton === true ? -0.5 : 0,
                                                    borderRadius: 5,
                                                    color: autoSaveIconColor,
                                                }}
                                            >
                                                {autoSaveOnClick && showButton === true && (
                                                    <IconButton
                                                        onClick={autoSaveOnClick}
                                                        sx={{
                                                            padding: 0.5,
                                                            "& .auto-save-not-hover-icon": {
                                                                display: "flex",
                                                                alignItems: "flex-start",
                                                                height: "20px",
                                                            },
                                                            "& .auto-save-hover-icon": {
                                                                display: "none",
                                                                alignItems: "flex-start",
                                                                height: "20px",
                                                            },
                                                            "&:hover": {
                                                                ".auto-save-not-hover-icon": {
                                                                    display: "none",
                                                                },
                                                                ".auto-save-hover-icon": {
                                                                    display: "flex",
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        <Box
                                                            className="auto-save-not-hover-icon"
                                                            sx={{
                                                                display: "inline-block",
                                                            }}
                                                        >
                                                            {renderAutoSaveIcon(autoSaveStatus, autoSaveIconColor)}
                                                        </Box>
                                                        <Box className="auto-save-hover-icon">
                                                            <SyncIcon
                                                                sx={{
                                                                    fontSize: 20,
                                                                    color: autoSaveIconColor,
                                                                }}
                                                            />
                                                        </Box>
                                                    </IconButton>
                                                )}
                                                {(!autoSaveOnClick || !showButton) &&
                                                    renderAutoSaveIcon(autoSaveStatus, autoSaveIconColor)}
                                            </Box>

                                            {autoSaveText && (
                                                <Box
                                                    sx={{
                                                        display: "none",
                                                        position: "absolute",
                                                        width: "auto",
                                                        whiteSpace: "nowrap",
                                                        backgroundColor: autoSaveIconColor,
                                                        padding: 0.5,
                                                        paddingLeft: 1,
                                                        paddingRight: 1,
                                                        borderRadius: 1,
                                                        fontSize: "0.75rem",
                                                        top: autoSaveOnClick && showButton === true ? "35px" : "31px",
                                                        left: "-6px",
                                                        zIndex: 999,
                                                        color: autoSaveForegroundColor,

                                                        "&:before, &:after": {
                                                            content: "''",
                                                            position: "absolute",
                                                            bottom: "100%",
                                                            left: "11px",
                                                            border: "6px solid transparent",
                                                            borderBottomColor: autoSaveIconColor,
                                                        },
                                                        "&:after": {
                                                            left: "12px",
                                                            border: "5px solid transparent",
                                                            borderBottomColor: autoSaveIconColor,
                                                        },
                                                    }}
                                                    className="auto-save-info"
                                                >
                                                    <Typography sx={{ fontSize: "0.75rem" }}>{autoSaveText}</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            p: 1,
                                            pl: showAutoSave === true ? 0.75 : 2,
                                            pr: 2,
                                        }}
                                    >
                                        <Box sx={{ display: "block" }}>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.875rem",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {project?.name}
                                            </Typography>
                                            <Typography
                                                sx={{
                                                    fontSize: "0.8rem",
                                                    fontWeight: "light",
                                                }}
                                            >
                                                {t("confidentialityLevels." + project?.confidentialityLevel)}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            sx={{
                                                fontSize: "0.875rem",
                                                fontWeight: "bold",
                                                ml: 2,
                                            }}
                                        >
                                            {project?.createdAt
                                                ? new Date(project.createdAt).toISOString().split("T")[0]
                                                : ""}
                                        </Typography>
                                        <IconButton
                                            onClick={(event) => handleProjectInfoClick(event)}
                                            sx={{
                                                ml: 1,
                                                "&:hover": {
                                                    color: "secondary.main",
                                                },
                                                color: "text.primary",
                                                fontSize: "1rem",
                                            }}
                                        >
                                            <Edit sx={{ fontSize: "1rem" }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                        <HeaderNavigation />
                    </Box>
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
                        <PageBody updateAutoSaveOnClick={updateAutoSaveOnClick} {...props} />
                    </Box>
                    <div
                        style={{
                            position: "absolute",
                            bottom: 6,
                            right: 40,
                            fontSize: "75%",
                        }}
                    >
                        {footerLinks.map((link) => {
                            return (
                                <a
                                    key={link.url}
                                    href={link.url}
                                    style={{
                                        paddingRight: "10px",
                                        color: "grey",
                                    }}
                                >
                                    {link.text}
                                </a>
                            );
                        })}
                    </div>
                </Box>
                <Routes>
                    <Route path="editProject" element={<ProjectDialogPage />} />
                </Routes>
            </ErrorBoundary>
        );
    };

    return Inner;
};

const renderAutoSaveIcon = (autoSaveStatus: string, color: string) => {
    switch (autoSaveStatus) {
        case "uninitialized":
            return <CheckCircleOutlineIcon sx={{ fontSize: 20, color: color }} />;
        case "failed":
            return <ErrorOutlineIcon sx={{ fontSize: 20, color: color }} />;
        case "upToDate":
            return <CheckCircleOutlineIcon sx={{ fontSize: 20, color: color }} />;
        case "notUpToDate":
            return <CheckCircleOutlineIcon sx={{ fontSize: 20, color: color }} />;
        case "saving":
            return (
                <SyncIcon
                    sx={{
                        animationName: "autoSaveSavingAnimation",
                        animationDuration: "1s",
                        animationIterationCount: "infinite",
                        fontSize: 20,
                        color: color,
                    }}
                />
            );
    }
    return (
        <SyncIcon
            sx={{
                animationName: "autoSaveSavingAnimation",
                animationDuration: "1s",
                animationIterationCount: "infinite",
                fontSize: 20,
                color: color,
            }}
        />
    );
};

export const HeaderNavigation = () => {
    const { projectId, catalogId } = useParams();
    const { pathname, state } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation("mainMenu");

    const navigation = useAppSelector((state) => state.navigation);

    let defaultProjectButtons = [
        {
            value: `/projects/${projectId}/system`,
            text: t("system"),
            "data-testid": "navigation-header_system-button",
        },
        {
            value: `/projects/${projectId}/assets`,
            text: t("assets"),
            "data-testid": "navigation-header_assets-button",
        },
        {
            value: `/projects/${projectId}/threats`,
            text: t("threats"),
            "data-testid": "navigation-header_threats-button",
        },
        {
            value: `/projects/${projectId}/measures`,
            text: t("measures"),
            "data-testid": "navigation-header_measures-button",
        },
        {
            value: `/projects/${projectId}/risk`,
            text: t("risk"),
            "data-testid": "navigation-header_risk-button",
        },
        {
            value: `/projects/${projectId}/report`,
            text: t("report"),
            "data-testid": "navigation-header_report-button",
        },
        {
            value: `/projects/${projectId}/members`,
            text: t("member"),
            "data-testid": "navigation-header_members-button",
        },
    ];

    // viewer should not have access to the members page
    const userProjectRole = useAppSelector((state) => state.projects.current?.role);
    const userCatalogRole = useAppSelector((state) => state.catalogs.current?.role);
    const userRole = userProjectRole ?? userCatalogRole;

    if (!checkUserRole(userRole, USER_ROLES.EDITOR)) {
        defaultProjectButtons = defaultProjectButtons.filter((button) => !button.value.includes("members"));
    }

    let finalButtons: ToggleButtonConfig[] = [];
    let finalOnChangePath = (_event: SyntheticEvent, path: string) => {
        if (path != null) navigate(path);
    };

    // login page => language picker = A
    // inside project => universal navigation = B, project navigation = C, User login = D.
    // inside catalogue => universal navigation = B, catalogue navigation = C, language picker = A, User Login = D.
    // overview all => universal navigation = B, language picker = A, User Login = D.

    // C => inside project or catalogue.
    // !C => Login page or overview.
    // A && C => inside catalogue page, we need the navigation.
    // !A && C => inside a project, we need the project navigation.
    if (navigation.showProjectCatalogueInnerNavigation) {
        if (pathname.includes("/catalogs")) {
            // viewer should not see members page
            if (!checkUserRole(userRole, USER_ROLES.EDITOR)) {
                finalButtons = [];
            } else {
                const button = defaultProjectButtons.at(defaultProjectButtons.length - 1);
                if (button) {
                    button.value = `/catalogs/${catalogId}/members`;
                    finalButtons = [button];
                }
            }
        } else {
            finalButtons = defaultProjectButtons;

            finalOnChangePath = (_event: SyntheticEvent, path: string) => {
                if (path != null) {
                    const nextState = path === "/projects" ? null : state;

                    navigate(path, { state: nextState });
                }
            };
        }
    }

    // B => not loggin page.
    // A => show the language picker
    // !C  => login page or overview => no inner buttons.
    return (
        <ErrorBoundary>
            <Box sx={{ display: "flex", alignItems: "center" }}>
                {navigation.showUniversalHeaderNavigation && (
                    <ButtonNavigation
                        value={pathname}
                        onChange={finalOnChangePath}
                        buttonProps={{ width: "100px" }}
                        buttons={[
                            {
                                value: "/projects",
                                text: t("projects"),
                                "data-testid": "navigation-header_projects-page-button",
                            },
                            {
                                value: "/catalogs",
                                text: t("catalogs"),
                                "data-testid": "navigation-header_catalogs-page-button",
                            },
                        ]}
                    />
                )}
                {navigation.showUniversalHeaderNavigation && (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        {navigation.showProjectCatalogueInnerNavigation && (
                            <ButtonNavigation
                                size="medium"
                                value={pathname}
                                onChange={finalOnChangePath}
                                sx={{ ml: 1 }}
                                buttons={finalButtons}
                            />
                        )}
                    </Box>
                )}
                <LanguagePicker />
                {navigation.showUniversalHeaderNavigation && <UserPanel />}
            </Box>
        </ErrorBoundary>
    );
};

const ButtonNavigation = ({ buttons, buttonProps, ...props }: ToggleButtonsProps) => {
    return (
        <ToggleButtons
            buttonProps={{
                fontWeight: "bold",
                fontSize: "0.875rem",
                backgroundColor: "toggleButtons.header.background",
                hoverBackgroundColor: "toggleButtons.header.hoverBackground",
                selectedBackgroundColor: "toggleButtons.header.selectedBackground",
                selectedHoverBackgroundColor: "toggleButtons.header.selectedHoverBackground",
                ...buttonProps,
            }}
            buttons={buttons}
            {...props}
        />
    );
};
