import { Add, ArrowDownward, ArrowUpward } from "@mui/icons-material";
import { LinearProgress, useMediaQuery } from "@mui/material";
import { Box } from "@mui/system";
import { useTheme } from "@mui/material/styles";
import { useLayoutEffect, type ChangeEvent, type MouseEvent, type SyntheticEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Route, Routes } from "react-router";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { NavigationActions } from "#application/actions/navigation.actions.ts";
import { useConfirm } from "#application/hooks/use-confirm.hook.ts";
import { useProjectsList } from "#application/hooks/use-projects-list.hook.ts";
import { Page } from "#view/components/page.component.tsx";
import { ProjectsGridComponent } from "#view/components/projects-grid.component.tsx";
import { SearchField } from "#view/components/search-field.component.tsx";
import { ToggleButtons } from "#view/components/toggle-buttons.component.tsx";
import { CreatePage } from "#view/components/create-page.component.tsx";
import { usePageTitle } from "#application/hooks/use-page-title.hook.ts";
import { HeaderUtilityControls } from "#view/components/header-utility-controls.component.tsx";
import ProjectDialogPage from "./project-dialog.page";
import { ImportIconButton } from "#view/components/import-icon-button.component.tsx";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { useProjects } from "#application/hooks/use-projects.hook.ts";
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
export const ProjectsPage = CreatePage(HeaderUtilityControls, () => {
    const navigate = useNavigate();
    const { t } = useTranslation("projectsPage");
    usePageTitle(t("projects", { ns: "common" }));
    const { setSortDirection, setSearchValue, setSortBy, deleteProject, sortDirection, sortBy, isPending, projects } =
        useProjectsList();

    const { loadProjects } = useProjects();

    const dispatch = useAppDispatch();

    const { openConfirm } = useConfirm<ExtendedProject>();

    const theme = useTheme();
    const isWide = useMediaQuery(theme.breakpoints.up("lg"));
    const isMedium = useMediaQuery(theme.breakpoints.up("sm"));

    const projectsColumnCount = 1 + Number(isMedium) + Number(isWide);

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

    const onClickDeleteProject = (_event: MouseEvent<HTMLElement>, project: ExtendedProject) => {
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

    const onClickEditProject = (_event: MouseEvent<HTMLElement>, project: ExtendedProject) => {
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

            if (!file) {
                throw new Error("file not found");
            }

            const fileReader = new FileReader();
            fileReader.readAsText(file, "UTF-8");
            fileReader.onload = async (loadEvent: ProgressEvent<FileReader>) => {
                const content = loadEvent.target?.result;
                if (typeof content !== "string") {
                    return;
                }
                try {
                    await dispatch(ProjectsActions.importProjectFromJson(JSON.parse(content))).unwrap();
                    loadProjects();
                } catch (error) {
                    console.log(error);
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
                        <ImportIconButton id="import-data" tooltipTitle={t("importProject")} onChange={handleImport} />
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
                    columnCount={projectsColumnCount}
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
