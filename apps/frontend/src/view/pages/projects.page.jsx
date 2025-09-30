import { Add, ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { IconButton, LinearProgress, Tooltip } from "@mui/material";
import { Box } from "@mui/system";
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { Route, Routes } from "react-router-dom";
import { NavigationActions } from "../../application/actions/navigation.actions";
import { useConfirm } from "../../application/hooks/use-confirm.hook";
import { useProjectsList } from "../../application/hooks/use-projects-list.hook";
import { Page } from "../components/page.component";
import { ProjectsGridComponent } from "../components/projects-grid.component";
import { SearchField } from "../components/search-field.component";
import { ToggleButtons } from "../components/toggle-buttons.component";
import { CreatePage, HeaderNavigation } from "../components/with-menu.component";
import ProjectDialogPage from "./project-dialog.page";
import { ImportIconButton } from "../components/import-icon-button.component";
import { ProjectsActions } from "../../application/actions/projects.actions";
import { useProjects } from "../../application/hooks/use-projects.hook";
import { useUser } from "../../application/hooks/use-user.hook";

/**
 * on this page all projects are listed
 *
 * @component
 * @category Pages
 * @return {JSX.Element}
 */
export const ProjectsPage = CreatePage(HeaderNavigation, () => {
    const navigate = useNavigate();
    const { t } = useTranslation("projectsPage");
    const { setSortDirection, setSearchValue, setSortBy, deleteProject, sortDirection, sortBy, isPending, projects } =
        useProjectsList();

    const { loadProjects } = useProjects();

    const dispatch = useDispatch();

    const { openConfirm } = useConfirm();

    const isPrivileged = useUser();

    /**
     * Layout effect to change the header bar
     * to the current environment the user is at.
     */
    useLayoutEffect(() => {
        dispatch(
            NavigationActions.setPageHeader({
                showProjectCatalogueInnerNavigation: false,
                showUniversalHeaderNavigation: true,
                showProjectInfo: false,
                getCatalogInfo: false,
            })
        );
    });

    const onChangeSearchValue = (e) => {
        setSearchValue(e.target.value);
    };

    const onChangeSortBy = (e, sortBy) => {
        if (sortBy) {
            setSortBy(sortBy);
        }
    };

    const onChangeSortDirection = (e, sortDirection) => {
        if (sortDirection) {
            setSortDirection(sortDirection);
        }
    };

    const onClickAddProject = () => {
        navigate("/projects/add");
    };

    const onClickDeleteProject = (e, project) => {
        openConfirm({
            state: project,
            message: t("deleteMessage", { projectName: project.name }),
            acceptText: t("delete"),
            cancelText: t("cancel"),
            onAccept: (project) => {
                deleteProject(project);
            },
        });
    };

    const onClickEditProject = (e, project) => {
        navigate(`/projects/${project.id}`, { state: { project } });
    };

    /**
     * Imports a project from a json file.
     *
     * @event ImportIconButton#onChange
     * @param {SyntheticBaseEvent} e - Event of the
     */
    const handleImport = async (e) => {
        try {
            const file = e.currentTarget.files[0];

            e.currentTarget.value = "";

            if (!file) throw new Error("file not found");

            const fileReader = new FileReader();
            fileReader.readAsText(file, "UTF-8");
            fileReader.onload = (e) => {
                dispatch(ProjectsActions.importProjectFromJson(JSON.parse(e.target.result)));
                loadProjects();
            };
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <Box sx={{ overflow: "hidden" }}>
            {<LinearProgress sx={{ visibility: isPending ? "visible" : "hidden" }} />}
            <Page
                sx={{
                    paddingTop: 5,
                    paddingBottom: 4,
                    boxSizing: "border-box",
                }}
            >
                <Box display="flex" alignItems="center" justifyContent="space-between" paddingTop={1} paddingBottom={2}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <SearchField data-testid="projects-page_search-field" onChange={onChangeSearchValue} />
                        {isPrivileged && (
                            <IconButton
                                onClick={onClickAddProject}
                                sx={{
                                    ml: 1,
                                    "&:hover": {
                                        color: "secondary.main",
                                        bgcolor: "background.paper",
                                    },
                                    color: "text.primary",
                                }}
                                data-testid="projects-page_add-project-button"
                            >
                                <Tooltip title={t("addProjectBtn")}>
                                    <Add sx={{ fontSize: 18 }} />
                                </Tooltip>
                            </IconButton>
                        )}
                        {isPrivileged && (
                            <ImportIconButton
                                id="import-data"
                                tooltipTitle={t("importProject")}
                                sx={{
                                    color: "text.primary",
                                }}
                                onChange={handleImport}
                            />
                        )}
                    </Box>
                    <Box display="flex" alignItems="center" marginRight={4}>
                        <ToggleButtons
                            onChange={onChangeSortDirection}
                            value={sortDirection}
                            buttons={[
                                {
                                    icon: ArrowUpward,
                                    value: "asc",
                                    "data-testid": "projects-page_ascending-projects-sort-button",
                                },
                                {
                                    icon: ArrowDownward,
                                    value: "desc",
                                    "data-testid": "projects-page_descending-projects-sort-button",
                                },
                            ]}
                        />
                        <ToggleButtons
                            value={sortBy}
                            onChange={onChangeSortBy}
                            sx={{ ml: 1 }}
                            buttonProps={{
                                width: "75px",
                            }}
                            buttons={[
                                {
                                    text: t("projectList.sortBy.nameToggleBtn"),
                                    value: "name",
                                    "data-testid": "projects-page_sort-projects-by-name-button",
                                },
                                {
                                    text: t("projectList.sortBy.createdAtToggleBtn"),
                                    value: "createdAt",
                                    "data-testid": "projects-page_sort-projects-by-date-button",
                                },
                            ]}
                        />
                    </Box>
                </Box>

                <ProjectsGridComponent
                    projects={projects}
                    columnCount={3}
                    onClickDeleteProject={onClickDeleteProject}
                    onClickEditProject={onClickEditProject}
                />

                <Routes>
                    <Route path="add" element={<ProjectDialogPage />} />
                    <Route path=":projectId" element={<ProjectDialogPage />} />
                </Routes>
            </Page>
        </Box>
    );
});
