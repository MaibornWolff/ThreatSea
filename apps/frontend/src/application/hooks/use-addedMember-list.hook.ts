import { useEffect, useMemo } from "react";
import type { USER_ROLES } from "#api/types/user-roles.types.ts";
import { useMembers } from "./use-addedMember.hook";

export const useMembersList = (projectCatalogId: number, memberPath: string, memberRole: USER_ROLES | null) => {
    const { isAddedPending, items, loadAddedMembers, onConfirmDeleteMember } = useMembers();

    useEffect(() => {
        loadAddedMembers(projectCatalogId, memberPath);
    }, [projectCatalogId, memberPath, loadAddedMembers]);

    const filteredItems = useMemo(
        () => (memberRole != null ? items.filter((item) => item.role === memberRole) : items),
        [items, memberRole]
    );

    // Deterministic initial order; searching and per-column sorting are handled by the data grid.
    const sortedItems = useMemo(
        () => filteredItems.toSorted((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)),
        [filteredItems]
    );

    return {
        isPending: isAddedPending,
        onConfirmDeleteMember,
        members: sortedItems,
    };
};
