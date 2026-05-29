import { useCallback } from "react";
import type { Project } from "#api/types/project.types.ts";
import { ProjectsActions } from "#application/actions/projects.actions.ts";
import { projectsSelectors } from "#application/selectors/projects.selectors.ts";
import { useAppDispatch, useAppSelector } from "./use-app-redux.hook";

export const useProjects = () => {
    const dispatch = useAppDispatch();
    const items = useAppSelector(projectsSelectors.selectAll);
    const isPending = useAppSelector((state) => state.projects.isPending);

    const loadProjects = useCallback(() => {
        dispatch(ProjectsActions.getProjects());
    }, [dispatch]);

    const deleteProject = (project: Project) => {
        dispatch(ProjectsActions.deleteProject(project));
    };

    return {
        items,
        isPending,
        loadProjects,
        deleteProject,
    };
};
