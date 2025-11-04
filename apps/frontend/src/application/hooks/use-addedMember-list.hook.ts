import { useEffect, useMemo } from "react";
import type { Member } from "#api/types/members.types.ts";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { useMembers } from "./use-addedMember.hook";
import { useList } from "./use-list.hooks";

const searchableMemberFields: (keyof Pick<Member, "name" | "email">)[] = ["name", "email"];
const sortableMemberFields: (keyof Pick<Member, "name" | "email" | "role">)[] = ["name", "email", "role"];
type MemberSortField = (typeof sortableMemberFields)[number];

export const useMembersList = (projectCatalogId: number, memberPath: string, memberRole: USER_ROLES | null) => {
    const { isAddedPending, items, loadAddedMembers, onConfirmDeleteMember } = useMembers();
    const { setSortDirection, setSearchValue, setSortBy, sortDirection, searchValue, sortBy } = useList("addedMembers");

    useEffect(() => {
        loadAddedMembers(projectCatalogId, memberPath);
    }, [projectCatalogId, memberPath, loadAddedMembers]);

    const filteredItems = useMemo(() => {
        let resItems = items.filter((item) => {
            const lcSearchValue = searchValue.toLowerCase();

            return searchableMemberFields.some((searchField) =>
                item[searchField].toLowerCase().includes(lcSearchValue)
            );
        });

        if (memberRole !== null) {
            resItems = resItems.filter((item) => item.role === memberRole);
        }

        return resItems;
    }, [items, searchValue, memberRole]);

    const sortedItems = useMemo(() => {
        const sortField: MemberSortField = sortableMemberFields.includes(sortBy as MemberSortField)
            ? (sortBy as MemberSortField)
            : "name";

        return filteredItems.sort((a, b) => {
            if (sortDirection === "asc") {
                if (sortField === "role") return a[sortField] < b[sortField] ? -1 : 1;
                else return a[sortField].toLowerCase() < b[sortField].toLowerCase() ? -1 : 1;
            } else {
                if (sortField === "role") return a[sortField] > b[sortField] ? -1 : 1;
                else return a[sortField].toLowerCase() > b[sortField].toLowerCase() ? -1 : 1;
            }
        });
    }, [filteredItems, sortBy, sortDirection]);

    return {
        setSortDirection,
        setSearchValue,
        setSortBy,
        sortDirection,
        searchValue,
        sortBy,
        isPending: isAddedPending,
        onConfirmDeleteMember,
        members: sortedItems,
    };
};
