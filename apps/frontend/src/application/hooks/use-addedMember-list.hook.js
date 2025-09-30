/**
 * @module use-addedMember-list.hook - Custom hook
 *     for the member lists.
 */

import { useEffect, useMemo } from "react";

import { useMembers } from "./use-addedMember.hook";
import { useList } from "./use-list.hooks";

/**
 * Creates a custom hook for the member list.
 * @param {number} projectCatalogId - id of the current project or catalogue.
 * @param {string} memberPath - Path for the member api to fetch the data
 *     for a project or a catalogue.
 * @param {string} memberRole - Role to filter members by.
 * @returns Member list hook.
 */
export const useMembersList = (projectCatalogId, memberPath, memberRole) => {
    const { isPending, items, loadAddedMembers, onConfirmDeleteMember } = useMembers();
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("addedMembers");

    /**
     * Loads members whenever the project changes
     * or new members are added.
     */
    useEffect(() => {
        loadAddedMembers(projectCatalogId, memberPath);
    }, [projectCatalogId, memberPath, loadAddedMembers]);

    /**
     * Filters the added members of the project or catalogue
     * by their name, email and role.
     */
    const filteredItems = useMemo(() => {
        let resItems = items.filter((item) => {
            const lcSearchValue = searchValue.toLowerCase();

            return ["name", "email"].some((searchField) => item[searchField].toLowerCase().includes(lcSearchValue));
        });

        if (memberRole !== null) {
            resItems = resItems.filter((item) => item.role === memberRole);
        }

        return resItems;
    }, [items, searchValue, memberRole]);

    const sortedItems = useMemo(
        () =>
            filteredItems.sort((a, b) => {
                if (sortDirection === "asc") {
                    if (sortBy === "role") return a[sortBy] < b[sortBy] ? -1 : 1;
                    else return a[sortBy].toLowerCase() < b[sortBy].toLowerCase() ? -1 : 1;
                } else {
                    if (sortBy === "role") return a[sortBy] > b[sortBy] ? -1 : 1;
                    else return a[sortBy].toLowerCase() > b[sortBy].toLowerCase() ? -1 : 1;
                }
            }),
        [filteredItems, sortBy, sortDirection]
    );

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        sortDirection,
        searchValue,
        sortBy,
        isPending,
        onConfirmDeleteMember,
        members: sortedItems,
    };
};
