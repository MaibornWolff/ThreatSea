import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ProjectsActions } from "../actions/projects.actions";
import { projectsSelectors } from "../selectors/projects.selectors";

/**
 * the useProjects hook can be used to load, create, delete or modify projects.
 * @module useProjects
 * @category Hooks
 */
export const useProjects = () => {
    const dispatch = useDispatch();
    const items = useSelector(projectsSelectors.selectAll);
    const isPending = useSelector((state) => state.projects.isPending);

    const loadProjects = useCallback(() => {
        dispatch(ProjectsActions.getProjects());
    }, [dispatch]);

    const deleteProject = (project) => {
        dispatch(ProjectsActions.deleteProject(project));
    };

    return {
        /**
         * list of projects
         * @member {Array} items
         */
        items,
        /**
         * indicates whether a request to the server is still pending
         * @member {Boolean} isPending
         */
        isPending,
        /**
         * load projects from API
         * @function setSortDirection
         */
        loadProjects,
        /**
         * delete a project
         * @function deleteProject
         */
        deleteProject,
    };
};
