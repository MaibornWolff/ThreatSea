import { useMemo } from "react";
import type { User } from "#api/types/members.types.ts";
import { useList } from "./use-list.hooks";
import { useAddableMembers } from "./use-addableMember.hook";

const searchableFields: (keyof Pick<User, "name" | "email">)[] = ["name", "email"];

export const useAddableMembersList = () => {
    const { addableMembers, loadAddableMembers } = useAddableMembers();
    const { searchValue, setSearchValue } = useList("addableMembers");

    const filteredItems = useMemo(() => {
        const resItems = addableMembers.filter((member) => {
            const lcSearchValue = searchValue.toLowerCase();

            return searchableFields.some((searchField) => member[searchField].toLowerCase().includes(lcSearchValue));
        });
        return resItems;
    }, [addableMembers, searchValue]);

    return {
        loadAddableMembers,
        setSearchValue,
        addableMembers: filteredItems,
    };
};
