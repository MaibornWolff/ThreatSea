import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import { IconButton, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { useLayoutEffect, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "#application/hooks/use-app-redux.hook.ts";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { store } from "#main.tsx";
import { CatalogsActions } from "#application/actions/catalogs.actions.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { catalogsSelector } from "#application/selectors/catalogs.selector.ts";
import { editorSelectors } from "#application/selectors/editor.selectors.ts";
import { projectsSelectors } from "#application/selectors/projects.selectors.ts";
import logo from "#images/threatsealogo-dez.png";
import ErrorBoundary from "#view/wrappers/error.wrapper.tsx";
import { colors } from "#view/wrappers/tokens.ts";
import { useProjectTabs } from "#application/hooks/use-project-tabs.hook.ts";
import { HeaderLevelOneNav } from "./header-level-one-nav.component";
import { HeaderProjectTabs } from "./header-project-tabs.component";
import ProjectDialogPage from "#view/pages/project-dialog.page.tsx";
import { Edit } from "@mui/icons-material";

export const CreatePage = <P extends object>(
    HeaderRightSlot: ComponentType,
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

        let autoSaveIconColor: string = colors.text.statusNeutral;
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
                autoSaveIconColor = colors.text.statusNeutral;
                break;
            case "saving":
                autoSaveIconColor = colors.text.statusNeutral;
                break;
        }

        let autoSaveForegroundColor = "primary.main";
        switch (autoSaveStatus) {
            case "uninitialized":
            case "failed":
            case "upToDate":
            case "notUpToDate":
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

        const showProjectCatalogueInnerNavigation = useAppSelector(
            (state) => state.navigation.showProjectCatalogueInnerNavigation
        );
        const hasManyTabs = showProjectCatalogueInnerNavigation && !pathname.includes("/catalogs");
        const projectTabs = useProjectTabs();

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
                        data-edit-protected
                        sx={(theme) => ({
                            display: "grid",
                            alignItems: "center",
                            columnGap: 1,
                            paddingTop: 1.5,
                            paddingBottom: 1.5,
                            paddingLeft: { xs: 2, md: 6 },
                            paddingRight: { xs: 2, md: 6 },
                            backgroundColor: "page.headerBackground",
                            ...(hasManyTabs
                                ? {
                                      gridTemplateColumns: "auto 1fr auto",
                                      gridTemplateAreas: `"logo title right" "buttons buttons buttons"`,
                                      rowGap: 1,
                                      [theme.breakpoints.up(1600)]: {
                                          gridTemplateColumns: "auto auto 1fr auto auto auto",
                                          gridTemplateAreas: `"logo title . levelOne tabs right"`,
                                          rowGap: 0,
                                      },
                                  }
                                : {
                                      gridTemplateColumns: "auto auto 1fr auto auto",
                                      gridTemplateAreas: `"logo title . levelOne right"`,
                                  }),
                        })}
                    >
                        <Box
                            sx={{
                                gridArea: "logo",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <Link to="/">
                                <img id={"logo"} src={logo} height={48} alt={"Logo"} />
                            </Link>
                        </Box>
                        {showProjectInfo && (
                            <Box
                                sx={{
                                    gridArea: "title",
                                    justifySelf: "center",
                                    display: "flex",
                                    alignItems: "center",
                                    bgcolor: "primary.dark",
                                    color: "text.primary",
                                    borderRadius: 5,
                                    boxShadow: 1,
                                }}
                            >
                                {showAutoSave === true && (
                                    <Box
                                        sx={{
                                            display: "inline-block",
                                            position: "relative",
                                            width: autoSaveOnClick && showButton === true ? "28px" : "20px",
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
                        <Box
                            sx={(theme) => ({
                                display: "contents",
                                ...(hasManyTabs && {
                                    [theme.breakpoints.down(1600)]: {
                                        display: "flex",
                                        gridArea: "buttons",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexWrap: "wrap",
                                        gap: 1,
                                    },
                                }),
                            })}
                        >
                            <HeaderLevelOneNav projectTabs={projectTabs} />
                            <HeaderProjectTabs projectTabs={projectTabs} />
                        </Box>
                        <HeaderRightSlot />
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
        default:
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
};
