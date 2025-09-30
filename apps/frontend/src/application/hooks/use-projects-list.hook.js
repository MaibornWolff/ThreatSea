import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { socket } from "../../api/system-socket.api";
import { ProjectsActions } from "../actions/projects.actions";
import { useList } from "./use-list.hooks";
import { useProjects } from "./use-projects.hook";

/**
 * the useProjectsList hook can be used to filter and sort a project list. It is modified from the useList hook.
 * @module useProjectsList
 * @category Hooks
 */
export const useProjectsList = () => {
    const dispatch = useDispatch();
    const { isPending, items, deleteProject, loadProjects } = useProjects();
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("projects");

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const filteredItems = useMemo(
        () =>
            items.filter((item) => {
                const lcSearchValue = searchValue.toLowerCase();
                return ["name", "description"].some((searchField) =>
                    item[searchField].toLowerCase().includes(lcSearchValue)
                );
            }),
        [items, searchValue]
    );

    const sortedItems = useMemo(
        () =>
            filteredItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (sortBy == "name") {
                        return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) < new Date(b[sortBy]) ? -1 : 1;
                    }
                } else {
                    if (sortBy == "name") {
                        return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                    } else {
                        return new Date(a[sortBy]) > new Date(b[sortBy]) ? -1 : 1;
                    }
                }
            }),
        [filteredItems, sortBy, sortDirection]
    );

    useEffect(() => {
        socket.on("set_project", (data) => {
            const project = JSON.parse(data);
            dispatch(ProjectsActions.setProject(project));
        });
        socket.on("remove_project", (data) => {
            const project = JSON.parse(data);
            dispatch(ProjectsActions.removeProject(project));
        });
    }, [dispatch]);

    return {
        /**
         * @function setSortDirection
         */
        setSortDirection,
        /**
         * @function setSearchValue
         */
        setSearchValue,
        /**
         * @function setSortBy
         */
        setSortBy,
        /**
         * @function deleteProject
         */
        deleteProject,
        /**
         * sort direction of a list (e.g. asc|desc)
         * @member {String} sortDirection
         */
        sortDirection,
        /**
         * a search value according to which a list is searched for
         * @member {String} searchValue
         */
        searchValue,
        /**
         * sort by of a list (e.g. name)
         * @member {String} sortBy
         */
        sortBy,
        /**
         * indicates whether a request to the server is still pending
         * @member {Boolean} isPending
         */
        isPending,
        /**
         * a filtered and sorted list of projects
         * @member {Array} sortedItems
         */
        projects: sortedItems,
    };
};
