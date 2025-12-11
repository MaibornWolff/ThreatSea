import { useEffect, useMemo } from "react";
import type { ExtendedProject } from "#api/types/project.types.ts";
import { socket } from "../../api/system-socket.api";
import { ProjectsActions } from "../actions/projects.actions";
import { useAppDispatch } from "./use-app-redux.hook";
import { useList } from "./use-list.hooks";
import { useProjects } from "./use-projects.hook";

const sortableFields: (keyof Pick<ExtendedProject, "name" | "createdAt">)[] = ["name", "createdAt"];
type ProjectSortField = (typeof sortableFields)[number];

const searchableFields: (keyof Pick<ExtendedProject, "name" | "description">)[] = ["name", "description"];

export const useProjectsList = () => {
    const dispatch = useAppDispatch();
    const { isPending, items, deleteProject, loadProjects } = useProjects();
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("projects");

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const filteredItems: ExtendedProject[] = useMemo(
        () =>
            items.filter((item) =>
                searchableFields.some((searchField) =>
                    (item[searchField] ?? "").toLowerCase().includes(searchValue.toLowerCase())
                )
            ),
        [items, searchValue]
    );

    const sortedItems: ExtendedProject[] = useMemo(() => {
        const sortField: ProjectSortField = sortableFields.includes(sortBy as ProjectSortField)
            ? (sortBy as ProjectSortField)
            : "name";

        return filteredItems.sort((a, b) => {
            if (sortDirection === "asc") {
                if (sortField == "name") {
                    return a[sortField].toLowerCase() < b[sortField].toLowerCase() ? -1 : 1;
                } else {
                    return new Date(a[sortField]) < new Date(b[sortField]) ? -1 : 1;
                }
            } else {
                if (sortField == "name") {
                    return a[sortField].toLowerCase() > b[sortField].toLowerCase() ? -1 : 1;
                } else {
                    return new Date(a[sortField]) > new Date(b[sortField]) ? -1 : 1;
                }
            }
        });
    }, [filteredItems, sortBy, sortDirection]);

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
