/**
 * @module use-addableMember-list.hook - Custom hook
 *     for the addable members list.
 */

import { useMemo } from "react";
import { useList } from "./use-list.hooks";
import { useAddableMembers } from "./use-addableMember.hook";

/**
 * Creates a custom hook for the addable members list.
 *
 * @returns Addable members list hook.
 */
export const useAddableMembersList = () => {
    const { addableMembers, loadAddableMembers } = useAddableMembers();
    const { searchValue, setSearchValue } = useList("addableMembers");

    /**
     * Filters the addable members by their names.
     */
    const filteredItems = useMemo(() => {
        let resItems = addableMembers.filter((member) => {
            const lcSearchValue = searchValue.toLowerCase();

            return ["name", "email"].some((searchField) => member[searchField].toLowerCase().includes(lcSearchValue));
        });
        return resItems;
    }, [addableMembers, searchValue]);

    return {
        loadAddableMembers,
        setSearchValue,
        addableMembers: filteredItems,
    };
};
