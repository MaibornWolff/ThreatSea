import { Add, ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { LinearProgress } from "@mui/material";
import { Box } from "@mui/system";
import { useLayoutEffect, type ChangeEvent, type MouseEvent as ReactMouseEvent, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Route, Routes } from "react-router-dom";
import type { ExtendedProject } from "#api/types/project.types.ts";
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
import { PageHeading } from "#view/components/page-heading.component.tsx";
import type { SortDirection } from "#application/actions/list.actions.ts";
import { useAppDispatch } from "#application/hooks/use-app-redux.hook.ts";
import { IconButton } from "#view/components/icon-button.component.tsx";

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

    const dispatch = useAppDispatch();

    const { openConfirm } = useConfirm<ExtendedProject>();

    const { isPrivileged } = useUser();

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
    }, [dispatch]);

    const onChangeSearchValue = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchValue(event.target.value);
    };

    const onChangeSortBy = (_event: SyntheticEvent, sortBy: "name" | "createdAt" | null) => {
        if (sortBy) {
            setSortBy(sortBy);
        }
    };

    const onChangeSortDirection = (_event: SyntheticEvent, sortDirection: SortDirection | null) => {
        if (sortDirection) {
            setSortDirection(sortDirection);
        }
    };

    const onClickAddProject = () => {
        navigate("/projects/add");
    };

    const onClickDeleteProject = (_event: ReactMouseEvent<HTMLElement>, project: ExtendedProject) => {
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

    const onClickEditProject = (_event: ReactMouseEvent<HTMLElement>, project: ExtendedProject) => {
        navigate(`/projects/${project.id}`, { state: { project } });
    };

    /**
     * Imports a project from a json file.
     *
     * @event ImportIconButton#onChange
     * @param {SyntheticBaseEvent} e - Event of the
     */
    const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.currentTarget.files?.[0];

            event.currentTarget.value = "";

            if (!file) throw new Error("file not found");

            const fileReader = new FileReader();
            fileReader.readAsText(file, "UTF-8");
            fileReader.onload = (loadEvent: ProgressEvent<FileReader>) => {
                const content = loadEvent.target?.result;
                if (typeof content === "string") {
                    dispatch(ProjectsActions.importProjectFromJson(JSON.parse(content)));
                    loadProjects();
                }
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
                    paddingBottom: 4,
                    boxSizing: "border-box",
                }}
            >
                <PageHeading>{t("heading")}</PageHeading>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 1,
                        paddingBottom: 2,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <SearchField data-testid="projects-page_search-field" onChange={onChangeSearchValue} />
                        {isPrivileged && (
                            <IconButton
                                onClick={onClickAddProject}
                                sx={{
                                    ml: 1,
                                }}
                                data-testid="projects-page_add-project-button"
                                title={t("addProjectBtn")}
                            >
                                <Add sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                        {isPrivileged && (
                            <ImportIconButton
                                id="import-data"
                                tooltipTitle={t("importProject")}
                                onChange={handleImport}
                            />
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            marginRight: 4,
                        }}
                    >
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
